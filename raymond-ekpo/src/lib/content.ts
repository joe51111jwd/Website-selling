import { getCollection, type CollectionEntry } from 'astro:content';

export type Service = CollectionEntry<'services'>;
export type WorkEntry = CollectionEntry<'work'>;

export async function getServices(): Promise<Service[]> {
  const all = await getCollection('services');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getWork(kind?: WorkEntry['data']['kind']): Promise<WorkEntry[]> {
  const all = await getCollection('work', (e) => !e.data.draft && (!kind || e.data.kind === kind));
  return all.sort((a, b) => a.data.order - b.data.order || b.data.date.getTime() - a.data.date.getTime());
}

export function readingMinutes(body = ''): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 230));
}

export const pad = (n: number) => String(n).padStart(2, '0');
