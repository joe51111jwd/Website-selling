# TMWRK Roster Intelligence

An early-warning system for TMWRK's catalog. Once a day it reads every watched track's Spotify streams and
the number of new TikTok videos using its sound, compares each with that track's own last seven days, and
emails the team when either one jumps. **Never miss a moment.**

Built to the &SONS development brief (November 2026): three artists including DRAMA and Major Lazer, up to 20
tracks, daily collection, configurable spike detection, de-duplicated email alerts, and a password-protected,
mobile-friendly dashboard. Fixed fee $1,000; data, email and hosting subscriptions are separate.

## Status

| Milestone | State |
| --- | --- |
| 1. Data sources, access, pricing | Researched, see [FEASIBILITY.md](FEASIBILITY.md). Soundcharts Starter (~$50/mo) covers both signals. Waiting on a trial key to check the twenty real tracks. |
| 2. Monitoring, storage, detection, alerts, dashboard | Built. Runs end to end on clearly labelled simulated data; the Soundcharts adapter is written against their documented API and goes live when the keys are set. |
| 3. Test, deploy, document, hand over | Tests pass, including the brief's success test. Deploy needs TMWRK's accounts (below). |

## The success test

> A historical or simulated TikTok spike for an older DRAMA track triggers the correct email even when Spotify stays flat.

```bash
npm run success-test
```

```
TikTok:  1000 today vs 51/day → SPIKE
Spotify: 6091 today vs 6192/day → flat

[SIMULATED] MUSIC ACTIVITY ALERT | DRAMA | Older single
TikTok: 1,000 new creations in 24 hours | Baseline: 51/day
Change: +949 creations / +1,877% | Action: Review sound
```

`npm test` runs the detector's tests (gaps in TikTok data, the absolute and percentage bars, no repeats,
cooldown and escalation, and the success test). Settings → "Send the test alert" emails the same case for real.
Live collection is verified separately once the Soundcharts key is in.

## How it decides

Providers give running totals (streams to date, videos to date), and TikTok counts may only refresh every
other day. So each total becomes a per-day rate (a gap is spread evenly over its days), then:

- **Baseline:** the average daily rate over the previous 7 days, with a floor so 2 → 40 isn't +1,900%.
- **Spike:** at least **+150%** over the baseline **and** at least **300 more TikTok videos** or **25,000 more
  Spotify streams** that day. Both bars, so a hit's normal wobble and a tiny base's noise don't fire.
- **Separately:** Spotify and TikTok are judged on their own; either can alert.
- **No duplicates:** one email per track, platform and day; a spike that holds at the same level stays quiet
  for 3 days unless it grows another 50%.

All of these are editable in Settings. Code: `lib/detect.ts` (pure functions, tested in `tests/`).

## The dashboard

- **Headline:** "One track is moving." with today's alert as a card (the email, at a glance).
- **Seismograph:** every track, both platforms, as a ratio of its own normal over 30 days. Quiet tracks hug
  the line; the ones that take off stand out.
- **Board:** each track's daily Spotify streams and TikTok videos, change vs. baseline, a 7-day trend and a
  status (Spike, Rising, Cooling, Quiet). Back-catalog songs are tagged.
- **Track page:** 30 days per platform with the rolling baseline and alert markers, links out.
- **Tracks:** add by ISRC or Spotify link (looked up on Soundcharts first), remove, 20 max.
- **Alerts sent:** every email, rendered. Without an email key, alerts collect here instead of sending.
- **Settings:** thresholds, recipients, data/email/storage status, the test alert.
- Top bar: data source (Simulated / Soundcharts), last successful update, Run now.

## Stack

Next.js 16 (App Router, server actions), Postgres via Supabase (`DATABASE_URL`) or a local JSON file, Resend
for email (plain REST), Vercel Cron for the daily run (`vercel.json`, 13:17 UTC). One shared team password,
signed http-only cookie (`proxy.ts`).

```
lib/detect.ts               the detector (pure)
lib/collect.ts              the daily job: fetch → store → judge → email
lib/providers/soundcharts.ts  GET /api/v2/song/{uuid}/audience/{spotify|tiktok}
lib/providers/demo.ts       SIMULATED data, including the success-test scenario
lib/store.ts                Postgres or JSON file; tables are created on first use
lib/email.ts                the alert email (subject/lines match the brief's example)
app/                        dashboard, track, tracks, alerts sent, settings, login, /api/cron
```

## Run it

```bash
npm install
npm run dev            # http://localhost:5210, password "demo" when DASHBOARD_PASSWORD is unset
npm test
npm run collect        # one daily run from the command line
```

With no keys set it runs on simulated data, stored in `.data/tmwrk.json`, and every screen and email says so.

## Going live (handoff checklist)

1. **Soundcharts:** start the free trial (1,000 calls), run the 20 real ISRCs, compare TikTok totals with the
   counts on TikTok, confirm in writing that Starter includes `audience/tiktok` and the real refresh cadence
   for low-volume sounds, and that internal alert emails are within their terms. Then subscribe to Starter.
   Set `SOUNDCHARTS_APP_ID`, `SOUNDCHARTS_API_KEY`.
2. **Supabase:** new project; set `DATABASE_URL` (the pooled connection string). Tables create themselves.
3. **Resend:** verify TMWRK's sending domain; set `RESEND_API_KEY`, `ALERT_FROM`, `ALERT_TO` (comma-separated).
4. **Vercel:** import the repo with `tmwrk/` as the root; set the variables in `.env.example`, including
   `DASHBOARD_PASSWORD` and `CRON_SECRET`. The cron in `vercel.json` starts calling `/api/cron` daily.
5. Delete the simulated tracks on the Tracks page and add the twenty real ones.

Recurring costs, for approval: Soundcharts Starter ~$50/mo, Supabase free tier, Resend free tier (3,000
emails/mo), Vercel Hobby or Pro.

## Not in this phase

Full-roster onboarding, more platforms (YouTube, Shazam, Apple Music), geography, per-track thresholds,
weekly opportunity reports, predictive scoring and native apps: the brief's "what comes next".
