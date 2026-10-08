// The 3D VIEW camera rig (brief 4.1, 6). Owner: A2. Pure math, no three.
// A hand-rolled damp, x += (target - x) * (1 - e^(-lambda*dt)) with lambda = 4, on yaw, pitch and dolly,
// toward targets that are themselves SETTLE-eased (auto swing to the rest pose over 2.2 s).
// Pointer look +-3 deg, drag -6..+10 deg yaw and +-3 deg pitch, arrow keys +-2 deg.

import { damp, settleEase } from '../system/easing';
import { POSE, TIMING } from './heroLayout';

export interface Pose {
  yaw: number;
  pitch: number;
  dolly: number;
}

export interface PoseLimits {
  yaw: number;
  pitch: number;
  dolly: number;
  yawMin: number;
  yawMax: number;
  pitchMin: number;
  pitchMax: number;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export class OrbitRig {
  readonly pose: Pose = { yaw: 0, pitch: 0, dolly: 0 };
  /** the auto/scroll-driven base target */
  base: Pose = { yaw: 0, pitch: 0, dolly: 0 };
  /** pointer look, -1..1 each */
  look = { x: 0, y: 0 };
  /** user drag / key offsets, degrees */
  user = { yaw: 0, pitch: 0 };
  limits: PoseLimits;

  constructor(limits: PoseLimits) {
    this.limits = limits;
  }

  /** Swing target at s seconds after the freeze (SETTLE over 2.2 s). */
  swingTarget(s: number, scale = 1): Pose {
    const e = settleEase(Math.max(0, Math.min(1, s / TIMING.swing))) * scale;
    return { yaw: this.limits.yaw * e, pitch: this.limits.pitch * e, dolly: this.limits.dolly * e };
  }

  target(): Pose {
    const L = this.limits;
    const yaw = clamp(this.base.yaw + this.user.yaw + this.look.x * POSE.lookDeg, L.yawMin, L.yawMax);
    const pitch = clamp(this.base.pitch + this.user.pitch + this.look.y * POSE.lookDeg, L.pitchMin, L.pitchMax);
    return { yaw, pitch, dolly: this.base.dolly };
  }

  /** Advance the damped pose by dt seconds. Returns true while still moving. */
  step(dt: number): boolean {
    const t = this.target();
    const p = this.pose;
    p.yaw = damp(p.yaw, t.yaw, POSE.lambda, dt);
    p.pitch = damp(p.pitch, t.pitch, POSE.lambda, dt);
    p.dolly = damp(p.dolly, t.dolly, POSE.lambda, dt);
    return Math.abs(p.yaw - t.yaw) > 0.005 || Math.abs(p.pitch - t.pitch) > 0.005 || Math.abs(p.dolly - t.dolly) > 0.0001;
  }

  snapTo(p: Pose) {
    this.pose.yaw = p.yaw;
    this.pose.pitch = p.pitch;
    this.pose.dolly = p.dolly;
  }

  /** Deterministic pose at s seconds after the freeze with no input (capture): integrate at 240 Hz. */
  poseAt(s: number, scale = 1): Pose {
    const p = { yaw: 0, pitch: 0, dolly: 0 };
    const dt = 1 / 240;
    const steps = Math.max(0, Math.round(s / dt));
    for (let i = 1; i <= steps; i++) {
      const t = this.swingTarget(i * dt, scale);
      p.yaw = damp(p.yaw, t.yaw, POSE.lambda, dt);
      p.pitch = damp(p.pitch, t.pitch, POSE.lambda, dt);
      p.dolly = damp(p.dolly, t.dolly, POSE.lambda, dt);
    }
    return p;
  }

  /** Drag by pixels (yaw from x, pitch from y). */
  drag(dxPx: number, dyPx: number, widthPx: number) {
    const k = 22 / Math.max(320, widthPx); // a full-width drag is ~22 degrees
    const L = this.limits;
    this.user.yaw = clamp(this.user.yaw + dxPx * k, L.yawMin - this.base.yaw, L.yawMax - this.base.yaw);
    this.user.pitch = clamp(this.user.pitch - dyPx * k, L.pitchMin - this.base.pitch, L.pitchMax - this.base.pitch);
  }

  key(dYaw: number, dPitch: number) {
    const L = this.limits;
    this.user.yaw = clamp(this.user.yaw + dYaw, L.yawMin - this.base.yaw, L.yawMax - this.base.yaw);
    this.user.pitch = clamp(this.user.pitch + dPitch, L.pitchMin - this.base.pitch, L.pitchMax - this.base.pitch);
  }

  clearUser() {
    this.user.yaw = 0;
    this.user.pitch = 0;
    this.look.x = 0;
    this.look.y = 0;
  }
}
