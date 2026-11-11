# Rendering chainmail on a remote GPU

All Blender scenes are plain Python scripts (no .blend files). `lib/common.py:setup_render()`
auto-selects the GPU (OPTIX > CUDA > HIP > METAL > ONEAPI) and falls back to CPU, so the same
scripts run anywhere. Force a device with `CHAINMAIL_DEVICE=OPTIX` (or `CPU`).

Run these from a machine that holds the SSH key (e.g. a Claude Code session on that computer),
from the repo's `chainmail/` folder. Set the connection once:

```bash
export GPU_SSH="ssh -i /path/to/id_ed25519 -p <port>"   # e.g. -p 29553
export GPU=root@<host>                                    # e.g. root@180.189.55.43
```

## 1. Install Blender 4.5 LTS on the box (match the version the scenes were tuned on)

```bash
$GPU_SSH $GPU 'set -e
apt-get update -q && apt-get install -y -q libxi6 libxkbcommon0 libsm6 libgl1 libxrender1 libxxf86vm1 libxfixes3 libegl1 rsync xz-utils wget python3-pil
cd /opt && wget -q https://download.blender.org/release/Blender4.5/blender-4.5.16-linux-x64.tar.xz
tar xf blender-4.5.16-linux-x64.tar.xz && ln -sf /opt/blender-4.5.16-linux-x64/blender /usr/local/bin/blender
blender --version | head -1 && nvidia-smi -L'
```

Blender 4.2 also has OptiX, but colour management and some node defaults differ from 4.5;
use 4.5.x so renders match what was art-directed.

## 2. Sync the Blender project (scripts, libs, fonts, HDRIs, textures ≈ 25 MB)

```bash
rsync -az --delete --exclude out --exclude previews --exclude blend -e "$GPU_SSH" blender tools $GPU:/root/chainmail/
```

## 3. Render

Product / packaging stills (each writes to `blender/out/<group>/<name>.png`):

```bash
$GPU_SSH $GPU 'cd /root/chainmail && for f in blender/scenes/{kit,goods,spirits}_*.py; do
  case "$f" in *kit_sequence.py) continue;; esac
  CHAINMAIL_DEVICE=OPTIX blender -b --factory-startup --python-exit-code 1 -P "$f" > "/root/$(basename "$f" .py).log" 2>&1 \
    && echo "ok  $f" || echo "FAIL $f"; done'
```

Packing sequence (121 frames, resumable; skips frames already on disk). It renders from a frozen
snapshot of the libs (git-ignored), so create it first with `bash tools/render_sequence.sh --freeze`:

```bash
$GPU_SSH $GPU 'cd /root/chainmail && CHAINMAIL_DEVICE=OPTIX BLENDER=blender bash tools/render_sequence.sh'
```

Check the log for `[chainmail] Cycles GPU: OPTIX -> NVIDIA GeForce RTX 5090`; if it says
"no GPU found", the render silently fell back to CPU.

## 4. Pull results back and publish to the site

```bash
rsync -az -e "$GPU_SSH" $GPU:/root/chainmail/blender/out/ blender/out/
python3 tools/optimize.py            # -> site/public/renders/**.webp (+ sequence frame sets)
```

Then commit `site/public/renders` (the PNG masters in `blender/out/` are git-ignored).
