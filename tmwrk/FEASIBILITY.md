# Milestone 1: data feasibility (Spotify streams + TikTok creations, 20 tracks)

Researched 2026-11-10, tested live against the Soundcharts sandbox; the "Tested" notes below come from that.

## 1. Soundcharts API

**Endpoints and fields**
- One endpoint covers both metrics: `GET /api/v2/song/{uuid}/audience/{platform}`. For Spotify the platform is `spotify` and the value is "Streams". For TikTok it is `tiktok` and the value is "Video count". [1][2]
- **Parameters:** `startDate`, `endDate` (YYYY-MM-DD; if omitted, the start defaults to 30 days before the end), `identifier`, `offset`, `limit` (max 100), and `sort`. [1][2]
- **Response:** `items[].date` and `items[].plots[] {identifier, value}`. There is one plot for each platform ID linked to the song. [2]
- **Spotify streams are cumulative.** Soundcharts says they "are refreshed daily for all songs with more than 1,000 streams". [3]
- **Duplicate Spotify IDs:** A song can have several Spotify IDs, and some repeat the same total. You must add up only the unique values. [3] Tested: "bad guy" returned 8+ Spotify IDs, all showing 3,003,456,742.
- **TikTok sound IDs:** One song maps to many TikTok music IDs. `GET /api/v2/song/{uuid}/identifiers?platform=tiktok` lists them. [2] Tested: "bad guy" has 282 TikTok IDs. The audience response returned 146 per-sound plots, and their sum (51,928) matched the `tiktok` total in current stats (51,939).
- **TikTok cadence:** I could not confirm it in the current docs. The old dedicated endpoint, `GET /api/v2/tiktok/music/{identifier}/video/volume`, was documented as refreshing by volume: daily above 10k videos, every 2 days for 5k–10k, and down to every 30 days below 100. [4][5] That page now redirects and the endpoint is not in the current OpenAPI spec. [2] Tested: sandbox TikTok data points were dated every 2 days (Nov 5, 7, 9).
- **Data check needed:** The TikTok totals Soundcharts returned look low for a major hit. Compare them with TikTok's on-screen counts during the trial before relying on them.
- **The deprecated `/song/{uuid}/spotify/stream` endpoint** is not in the current spec. [2][6]

**Looking up the UUID:**
- By ISRC: `GET /api/v2.25/song/by-isrc/{isrc}`.
- By Spotify ID: `GET /api/v2.25/song/by-platform/spotify/{id}`. [7][8]

**Auth and sandbox:**
- Auth: the recommended method is an OAuth client-credentials token (`Authorization: Bearer`, valid 1 hour). The legacy `x-app-id` / `x-api-key` headers are still supported. [9]
- Sandbox: app ID `soundcharts`, key `soundcharts`. It holds only Billie Eilish and Tones & I songs and fixed dates. [10] Tested: it works.
- Remaining quota is returned in the `x-quota-remaining` header. [11]

**Pricing (self-serve, billed monthly)** [12]

| Plan | Price/month | Calls/month |
|---|---|---|
| Starter | $50 | 10k |
| Developer | $250 | 500k |
| Startup | $500 | 4M |

- The free trial is capped at 1,000 calls in total. [6]
- "Get audience" is not on the premium-endpoint list, so Starter should cover it. [13] Confirm this in writing: the endpoint can still return a 403 "not included in your current plan". [2]
- **Usage for this project:** 20 tracks × 2 calls × 31 days ≈ 1,240 calls/month, plus about 40 one-time ID lookups. That fits Starter, with headroom for backfills.

**Usage rights** [14]
- Use is professional and internal.
- Commercial use or redistribution needs written permission.
- Shared material must say "Source: www.soundcharts.com".
- Internal team alert emails look fine. Confirm this with Soundcharts.

## 2. Alternatives

- **Chartmetric:** Covers both fields.
  - `GET /api/track/{id}` returns `cm_statistics.sp_streams` and `num_tt_videos` in one call. [15]
  - `GET /api/track/{id}/{platform}/stats/{mode}` gives a time series for `spotify` and `tiktok`, with a `type` such as `streams` or `posts`. [15]
  - IDs resolve through `/api/track/{isrc|spotify|tiktok}/{id}/get-ids`. [15]
  - Pricing: $350/mo (1 req/s), $600 (2 req/s), and up to $2,000. [16] The docs mention a prepaid credit plan (1 credit per call) but give no public price. [15]
- **Songstats:** The API covers TikTok and Spotify. [17] Pricing is by quote only (api@songstats.com). I could not confirm field names.
- **Viberate:** Says it has track streams and TikTok data, but publishes no API pricing or fields. [18]
- **Luminate:** Has song-level streams, priced by subscription and quote only. [19] I found no TikTok creation counts.

## 3. Official TikTok and Spotify routes

- **TikTok Research API:** Commercial users are not eligible. [20]
- **TikTok for Artists:** It has video-creation analytics that artists can share with managers. [21] I found no API or export.
- **TikTok Commercial Music Library:** I found no data API.
- **Spotify for Artists:** You can download CSV files by hand, including song stream counts. [22] I found no API.

## 4. Recommendation

- **Primary: Soundcharts Starter at about $50/month.** It is the cheapest authorized source that covers both fields, about $600/year. If they need premium endpoints, the next tiers are $250–$500.
- **Before building:**
  1. Run 20 real ISRCs through the 1,000-call trial to check coverage and per-sound TikTok totals.
  2. Get written confirmation of Starter access to `audience/tiktok` and of the actual TikTok refresh cadence.
  3. Get usage-rights sign-off.
- **Design notes:**
  - Turn cumulative values into daily deltas.
  - Count duplicate Spotify IDs once.
  - Base TikTok spike checks on a 7-day rate that tolerates gaps, because refreshes can be every 2 days or less often.
- **Backup: Chartmetric at $350/month.** Use it if Soundcharts' TikTok counts fail validation.
- **Reduced-scope fallback:**
  - Spotify streams alone through Soundcharts Starter, at the same $50.
  - TikTok checked by hand in TikTok for Artists, or via a weekly Spotify for Artists CSV export.
  - Or alert on TikTok only for each track's top sounds.

## Sources
1. https://developers.soundcharts.com/api/reference/song/get-audience
2. https://developers.soundcharts.com/openapi.json
3. https://help.soundcharts.com/en/articles/10125052-how-do-i-get-the-stream-count-for-an-artist
4. https://doc.api.soundcharts.com/api/v2/doc/reference/path/tiktok/get-music-video-count
5. https://developers.soundcharts.com/documentation/reference/tiktok/get-music-video-count
6. http://developers.soundcharts.com/api/reference/song/get-spotify-streams-deprecated
7. https://developers.soundcharts.com/api/reference/song/get-song-by-isrc
8. https://developers.soundcharts.com/api/reference/song/get-song-by-platform-id
9. https://developers.soundcharts.com/api/authorization
10. https://developers.soundcharts.com/documentation/sandbox-data
11. https://help.soundcharts.com/en/articles/10104308-how-can-i-track-my-api-usage
12. https://developers.soundcharts.com/pricing
13. https://help.soundcharts.com/en/articles/11394887-which-endpoints-are-premium
14. https://www.soundcharts.com/en/terms
15. https://apidocs.chartmetric.com/llms-full.txt
16. https://chartmetric.com/plans/api
17. https://stack.rostr.cc/listings/songstats
18. https://www.viberate.com/blog/music-analytics/the-best-public-music-api-for-music-industry-insights
19. https://luminatedata.com/api/
20. https://developers.tiktok.com/doc/research-api-faq
21. https://blog.symphonic.com/2025/06/10/everything-you-need-to-know-about-tiktok-for-artists-2/
22. https://support.spotify.com/us/artists/article/exporting-data/
