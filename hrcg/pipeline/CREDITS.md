# Media credits and generation log (repo file, not page copy)

All photo-style imagery and film of robots, bays and materials in this site is AI-generated concept
imagery. Robot 07 is an original concept design. Depth views are estimated by a monocular depth model.

Tools (named here for the record; vendor names never appear on the page, brief C13):
- Image and video generation: Higgsfield (models: gpt_image_2_5, nano_banana_pro / nano_banana_2, kling3_0, kling_o3_flf).
- Depth: Depth Anything V2 Small (Apache-2.0), ONNX on CPU.
- Control-target detection: pupil_apriltags (open-source AprilTag library).
- Encoding and plates: ffmpeg (SVT-AV1, x264), OpenCV, Pillow.

## Credits spent on new shots (brief §7b, cap 120; plan ceiling 105)

| Who | Balance before | Balance after | Spent |
|---|---|---|---|
| Director batch (N01b stills x2, N02, N03, N04 stills x2, N07 x5, N09 end still) | 296.05 | 274.05 | 22.00 |
| A5 (dependent videos + retakes) | 274.05 | 243.55 | 30.50 |
| **Total new shots** | | | **52.50** |

A5 cap was 45 cr; 30.50 used.

## A5 jobs

| Shot | Job | Model | Cost (cr) | Verdict |
|---|---|---|---|---|
| N04 still retake (N04-s4) | 54125b9c-24fa-47f2-b263-69cca81b103c | gpt_image_2_5 16:9 | 0.25 | PASS (the director's two N04 stills failed: read as feet, subject off-centre) |
| N09 end still retake (N09-end-r2) | fca74548-612b-4e79-9798-f3a2cfea8733 | gpt_image_2_5 16:9 | 0.25 | PASS (the first end still failed: not running bond) |
| N01b video | d057e747-b2ba-4a78-9b68-ca2dd264377f | kling3_0 pro 5 s 9:16, silent | 8.75 | PASS -> hero-snap-916 / phone freeze |
| N04 video | f2641d22-73ff-4205-96e3-c52e90978b10 | kling3_0 pro 5 s 16:9, silent | 8.75 | PASS -> det-n04 |
| N09 video | 297e7a57-59eb-4a0b-bcd0-f038c030ed31 | kling_o3_flf pro 5 s 16:9, silent | 6.25 | FAIL (wall re-forms a course taller in 4 frames) |
| N09 video retake | 6fdd3150-4661-46e2-b54c-cbad51ff7281 | kling_o3_flf pro 5 s 16:9, silent, start = end = N09-end-r2 | 6.25 | PASS -> el-c30 (seamless loop) |

The director's jobs and their verdicts are in the scratchpad `media/NEW_SHOTS.md`.

## Sources per shipped id

| Web id | Source |
|---|---|
| hero-snap-169, hero-still-169-*, hero-depth/plate/matte/meta-169 | c34-layout (Kling 3.0, job 1cce3f28-75cf-4ce8-a53c-40d19d571ca8), frames 60-84 |
| hero-snap-916 and the -916 set | N01b (job d057e747-…), frames 76-100 |
| plan-b40…b44, arena-0104, arena-poster, plan-b44-260, lines-b44 | bay loops b40-b44 (Kling 3.0) |
| el-c30 | N09 retake (job 6fdd3150-…) |
| el-c31 / el-c32 / el-c33 | c31-drywall / c32-bolt / c33-pipe (Kling 3.0) |
| det-v0 / det-n03 / det-n04 | v0-brick-macro (job 9365e6ca-…) / N03 (job d0e2c68e-…) / N04 (job f2641d22-…) |
| sec-* | c34-layout frame 18-30 (cleanest) + depth |
| ref21-portrait / bay-empty / mat-1…5 | ref21 (job 95509110-…) / N02 (job 011f0206-…) / N07-1…5 |
| tex-slab, hero-ground-* | ld14 (job a27fb8b4-…) |
| t7-*, kit/* | AprilTag tag36h11 ID 7 pattern (generated, not AI) |
