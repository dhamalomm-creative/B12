'use client';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotionConfig } from 'framer-motion';
import styles from './CursorGlow.module.css';

const SIZE = 520;

/**
 * A soft light that follows the mouse inside its parent element.
 * Only runs on devices with a precise pointer that can hover (not touch screens),
 * and never when the user prefers reduced motion. The parent needs
 * `position: relative` and `isolation: isolate`.
 */
export default function CursorGlow() {
  const ref = useRef(null);
  const reduce = useReducedMotionConfig();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const opacity = useMotionValue(0);
  const spring = { stiffness: 120, damping: 22, mass: 0.6 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const so = useSpring(opacity, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host || reduce) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;

    const move = (e) => {
      const r = host.getBoundingClientRect();
      x.set(e.clientX - r.left - SIZE / 2);
      y.set(e.clientY - r.top - SIZE / 2);
      opacity.set(1);
    };
    const leave = () => opacity.set(0);

    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    return () => {
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
    };
  }, [reduce, x, y, opacity]);

  if (reduce) return null;

  return (
    <motion.div
      ref={ref}
      className={styles.glow}
      style={{ x: sx, y: sy, opacity: so, width: SIZE, height: SIZE }}
      aria-hidden="true"
    />
  );
}
