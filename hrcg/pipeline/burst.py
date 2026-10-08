# D8 burst frame: the peak of the chalk plume = the frame with the most blue-chalk pixels
# (hue 200-235 deg, S >= 0.30, V >= 0.30), counted on a 480-px-wide copy. c34's peak is 84 by the brief.
# usage: python -I burst.py <clip.mp4> [from_frame]
import sys, json
import numpy as np, cv2
cap = cv2.VideoCapture(sys.argv[1]); lo = int(sys.argv[2]) if len(sys.argv) > 2 else 0
counts = []; i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    s = cv2.resize(f, (480, int(480 * f.shape[0] / f.shape[1])), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(s, cv2.COLOR_BGR2HSV)
    m = (hsv[..., 0] >= 100) & (hsv[..., 0] <= 118) & (hsv[..., 1] >= 77) & (hsv[..., 2] >= 77)
    counts.append(int(m.sum())); i += 1
peak = int(np.argmax(counts[lo:]) + lo)
print(json.dumps({'clip': sys.argv[1], 'peak': peak, 'counts': counts[::4]}))
