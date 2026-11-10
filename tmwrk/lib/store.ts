// Where everything lives. Postgres (Supabase) when DATABASE_URL is set; otherwise a JSON file, which is
// fine for local runs and demos (on a serverless host it sits in /tmp and resets on cold starts).

import fs from "node:fs/promises";
import postgres from "postgres";
import path from "node:path";
import type { Alert, Artist, Platform, RunLog, Snapshot, Thresholds, Track } from "./types";
import { DEFAULT_THRESHOLDS } from "./types";

export interface Store {
  artists(): Promise<Artist[]>;
  upsertArtist(a: Artist): Promise<void>;
  tracks(): Promise<Track[]>;
  upsertTrack(t: Track): Promise<void>;
  removeTrack(id: string): Promise<void>;
  snapshots(q?: { trackId?: string; since?: string }): Promise<Snapshot[]>;
  putSnapshots(s: Snapshot[]): Promise<void>;
  alerts(q?: { trackId?: string; platform?: Platform; limit?: number }): Promise<Alert[]>;
  putAlert(a: Alert): Promise<void>;
  runs(limit?: number): Promise<RunLog[]>;
  putRun(r: RunLog): Promise<void>;
  thresholds(): Promise<Thresholds>;
  setThresholds(t: Thresholds): Promise<void>;
  /** emails written instead of sent (no Resend key), newest first */
  outbox(): Promise<{ id: string; at: string; to: string[]; subject: string; html: string; text: string }[]>;
  putOutbox(m: { id: string; at: string; to: string[]; subject: string; html: string; text: string }): Promise<void>;
  isEmpty(): Promise<boolean>;
}

type Data = {
  artists: Artist[];
  tracks: Track[];
  snapshots: Snapshot[];
  alerts: Alert[];
  runs: RunLog[];
  thresholds: Thresholds;
  outbox: Awaited<ReturnType<Store["outbox"]>>;
};

const empty = (): Data => ({ artists: [], tracks: [], snapshots: [], alerts: [], runs: [], thresholds: DEFAULT_THRESHOLDS, outbox: [] });

class FileStore implements Store {
  private file = process.env.DATA_FILE ?? (process.env.VERCEL ? "/tmp/tmwrk.json" : path.join(process.cwd(), ".data", "tmwrk.json"));
  private cache: Data | null = null;
  private async load(): Promise<Data> {
    if (this.cache) return this.cache;
    try {
      this.cache = { ...empty(), ...JSON.parse(await fs.readFile(this.file, "utf8")) };
    } catch {
      this.cache = empty();
    }
    return this.cache!;
  }
  private async save() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(this.cache));
  }
  private async edit(f: (d: Data) => void) {
    const d = await this.load();
    f(d);
    await this.save();
  }
  async artists() { return (await this.load()).artists; }
  async upsertArtist(a: Artist) { await this.edit((d) => { d.artists = [...d.artists.filter((x) => x.id !== a.id), a]; }); }
  async tracks() { return (await this.load()).tracks; }
  async upsertTrack(t: Track) { await this.edit((d) => { d.tracks = [...d.tracks.filter((x) => x.id !== t.id), t]; }); }
  async removeTrack(id: string) {
    await this.edit((d) => { d.tracks = d.tracks.filter((x) => x.id !== id); d.snapshots = d.snapshots.filter((s) => s.trackId !== id); });
  }
  async snapshots(q: { trackId?: string; since?: string } = {}) {
    return (await this.load()).snapshots.filter((s) => (!q.trackId || s.trackId === q.trackId) && (!q.since || s.date >= q.since));
  }
  async putSnapshots(rows: Snapshot[]) {
    await this.edit((d) => {
      const key = (s: Snapshot) => `${s.trackId}|${s.platform}|${s.date}`;
      const m = new Map(d.snapshots.map((s) => [key(s), s]));
      rows.forEach((s) => m.set(key(s), s));
      d.snapshots = [...m.values()];
    });
  }
  async alerts(q: { trackId?: string; platform?: Platform; limit?: number } = {}) {
    return (await this.load()).alerts
      .filter((a) => (!q.trackId || a.trackId === q.trackId) && (!q.platform || a.platform === q.platform))
      .sort((a, b) => b.date.localeCompare(a.date) || b.sentAt.localeCompare(a.sentAt))
      .slice(0, q.limit ?? 500);
  }
  async putAlert(a: Alert) { await this.edit((d) => { d.alerts = [...d.alerts.filter((x) => x.id !== a.id), a]; }); }
  async runs(limit = 20) { return [...(await this.load()).runs].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit); }
  async putRun(r: RunLog) { await this.edit((d) => { d.runs = [...d.runs, r].slice(-200); }); }
  async thresholds() { return (await this.load()).thresholds; }
  async setThresholds(t: Thresholds) { await this.edit((d) => { d.thresholds = t; }); }
  async outbox() { return [...(await this.load()).outbox].sort((a, b) => b.at.localeCompare(a.at)); }
  async putOutbox(m: Data["outbox"][number]) { await this.edit((d) => { d.outbox = [...d.outbox, m].slice(-100); }); }
  async isEmpty() { return (await this.load()).tracks.length === 0; }
}

class PgStore implements Store {
  private sql: import("postgres").Sql;
  private ready: Promise<void>;
  constructor(url: string) {
    this.sql = postgres(url, { prepare: false });
    this.ready = this.migrate();
  }
  private async migrate() {
    const s = this.sql;
    await s`create table if not exists artists (id text primary key, name text not null)`;
    await s`create table if not exists tracks (id text primary key, data jsonb not null)`;
    await s`create table if not exists snapshots (track_id text not null, platform text not null, date date not null, total bigint not null, primary key (track_id, platform, date))`;
    await s`create table if not exists alerts (id text primary key, track_id text not null, platform text not null, date date not null, data jsonb not null)`;
    await s`create table if not exists runs (at timestamptz primary key, data jsonb not null)`;
    await s`create table if not exists kv (key text primary key, value jsonb not null)`;
    await s`create table if not exists outbox (id text primary key, at timestamptz not null, data jsonb not null)`;
  }
  private async q() { await this.ready; return this.sql; }
  async artists() { return (await (await this.q())`select id, name from artists order by name`) as unknown as Artist[]; }
  async upsertArtist(a: Artist) { await (await this.q())`insert into artists ${this.sql(a)} on conflict (id) do update set name = excluded.name`; }
  async tracks() { return ((await (await this.q())`select data from tracks`) as unknown as { data: Track }[]).map((r) => r.data); }
  async upsertTrack(t: Track) { await (await this.q())`insert into tracks (id, data) values (${t.id}, ${this.sql.json(t as never)}) on conflict (id) do update set data = excluded.data`; }
  async removeTrack(id: string) { const s = await this.q(); await s`delete from tracks where id = ${id}`; await s`delete from snapshots where track_id = ${id}`; }
  async snapshots(q: { trackId?: string; since?: string } = {}) {
    const s = await this.q();
    const rows = await s`select track_id, platform, to_char(date, 'YYYY-MM-DD') as date, total from snapshots
      where (${q.trackId ?? null}::text is null or track_id = ${q.trackId ?? null}) and (${q.since ?? null}::date is null or date >= ${q.since ?? null}::date)`;
    return rows.map((r) => ({ trackId: r.track_id, platform: r.platform, date: r.date, total: Number(r.total) }));
  }
  async putSnapshots(rows: Snapshot[]) {
    if (!rows.length) return;
    const s = await this.q();
    const vals = rows.map((r) => ({ track_id: r.trackId, platform: r.platform, date: r.date, total: Math.round(r.total) }));
    for (let i = 0; i < vals.length; i += 500)
      await s`insert into snapshots ${s(vals.slice(i, i + 500))} on conflict (track_id, platform, date) do update set total = excluded.total`;
  }
  async alerts(q: { trackId?: string; platform?: Platform; limit?: number } = {}) {
    const s = await this.q();
    const rows = await s`select data from alerts where (${q.trackId ?? null}::text is null or track_id = ${q.trackId ?? null})
      and (${q.platform ?? null}::text is null or platform = ${q.platform ?? null}) order by date desc limit ${q.limit ?? 500}`;
    return rows.map((r) => r.data as Alert);
  }
  async putAlert(a: Alert) {
    await (await this.q())`insert into alerts (id, track_id, platform, date, data) values (${a.id}, ${a.trackId}, ${a.platform}, ${a.date}, ${this.sql.json(a as never)}) on conflict (id) do nothing`;
  }
  async runs(limit = 20) { return ((await (await this.q())`select data from runs order by at desc limit ${limit}`) as unknown as { data: RunLog }[]).map((r) => r.data); }
  async putRun(r: RunLog) { await (await this.q())`insert into runs (at, data) values (${r.at}, ${this.sql.json(r as never)}) on conflict do nothing`; }
  async thresholds() {
    const r = await (await this.q())`select value from kv where key = 'thresholds'`;
    return r.length ? { ...DEFAULT_THRESHOLDS, ...(r[0].value as Thresholds) } : DEFAULT_THRESHOLDS;
  }
  async setThresholds(t: Thresholds) { await (await this.q())`insert into kv (key, value) values ('thresholds', ${this.sql.json(t as never)}) on conflict (key) do update set value = excluded.value`; }
  async outbox() { return ((await (await this.q())`select data from outbox order by at desc limit 100`) as unknown as { data: Awaited<ReturnType<Store["outbox"]>>[number] }[]).map((r) => r.data); }
  async putOutbox(m: Awaited<ReturnType<Store["outbox"]>>[number]) { await (await this.q())`insert into outbox (id, at, data) values (${m.id}, ${m.at}, ${this.sql.json(m as never)}) on conflict do nothing`; }
  async isEmpty() { return (await (await this.q())`select 1 from tracks limit 1`).length === 0; }
}

const g = globalThis as unknown as { __tmwrkStore?: Store };
export function store(): Store {
  if (!g.__tmwrkStore) g.__tmwrkStore = process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new FileStore();
  return g.__tmwrkStore;
}
