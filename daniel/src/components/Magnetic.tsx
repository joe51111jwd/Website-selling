import type { ReactNode } from "react";
import { motion, useTransform } from "motion/react";
import { useMagnetic } from "../lib/hooks";

/** Wraps its child in an element that leans toward the pointer. */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const { ref, x, y } = useMagnetic<HTMLSpanElement>(strength);
  // the label inside moves a little further than the shape, for depth
  const ix = useTransform(x, (v) => v * 0.45);
  const iy = useTransform(y, (v) => v * 0.45);
  return (
    <motion.span ref={ref} className={`magnetic${className ? ` ${className}` : ""}`} style={{ x, y }}>
      <motion.span className="magnetic-inner" style={{ x: ix, y: iy }}>
        {children}
      </motion.span>
    </motion.span>
  );
}
