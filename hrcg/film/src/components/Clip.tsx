// A footage clip shown through a source crop rect, scaled into a destination rect.
// Uses <Video> from @remotion/media (falls back to <OffthreadVideo> by itself if it cannot decode).
import React from 'react';
import { Video } from '@remotion/media';
import { Img, Sequence, staticFile, useVideoConfig } from 'remotion';
import { CLIP_SIZE, clipPath, fileGeom, type ClipId } from '../clips';

export type Rect = readonly [number, number, number, number];

export const Clip: React.FC<{
  id: ClipId;
  crop?: Rect; // source px
  dest: Rect; // comp px (aspect should match crop)
  trimBefore?: number; // comp frames
  from?: number;
  durationInFrames?: number;
  playbackRate?: number;
  style?: React.CSSProperties;
  name?: string;
}> = ({ id, crop, dest, trimBefore = 0, from, durationInFrames, playbackRate, style, name }) => {
  const { fps } = useVideoConfig();
  // crops are authored in canonical source px (1920x1076 / 1440² / 1076x1912); map them into the file
  const g = fileGeom(id);
  const cc = crop ?? [0, 0, CLIP_SIZE[id][0], CLIP_SIZE[id][1]];
  const c = [(cc[0] - g.offset[0]) * g.scale, (cc[1] - g.offset[1]) * g.scale, cc[2] * g.scale, cc[3] * g.scale];
  const [sw, sh] = g.size;
  const s = dest[2] / c[2];
  return (
    <Video
      name={name ?? id}
      src={staticFile(clipPath(id))}
      muted
      trimBefore={trimBefore}
      from={from}
      durationInFrames={durationInFrames}
      playbackRate={playbackRate}
      premountFor={fps}
      cropLeft={c[0] / sw}
      cropRight={(sw - c[0] - c[2]) / sw}
      cropTop={c[1] / sh}
      cropBottom={(sh - c[1] - c[3]) / sh}
      objectFit="fill"
      style={{
        position: 'absolute',
        left: dest[0] - c[0] * s,
        top: dest[1] - c[1] * s,
        width: sw * s,
        height: sh * s,
        ...style,
      }}
    />
  );
};

/**
 * Plays a clip from its first frame up to source frame `holdAt` once, then holds that frame (a still
 * extracted by scripts/stills.sh). For bays whose later frames must not be shown (b40, F-050).
 */
export const PlayHold: React.FC<{ id: ClipId; dest: Rect; holdAt: number; still: string; srcFps: number }> = ({
  id,
  dest,
  holdAt,
  still,
  srcFps,
}) => {
  const { fps } = useVideoConfig();
  const playF = Math.floor((holdAt / srcFps) * fps);
  return (
    <>
      <Sequence name={`${id} 0→${holdAt}`} durationInFrames={playF} premountFor={fps}>
        <Clip id={id} dest={dest} trimBefore={0} />
      </Sequence>
      <Sequence name={`${id} hold ${holdAt}`} from={playF} premountFor={fps}>
        <Img src={staticFile(still)} style={{ position: 'absolute', left: dest[0], top: dest[1], width: dest[2], height: dest[3] }} />
      </Sequence>
    </>
  );
};
