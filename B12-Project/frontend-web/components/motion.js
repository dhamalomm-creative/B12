'use client';
// Shared motion helpers. Everything here animates only opacity/transform and
// renders in its final state straight away when the user prefers reduced motion.
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useReducedMotionConfig } from 'framer-motion';

// Calm ease-out with no overshoot — used everywhere so the app moves as one.
export const EASE = [0.22, 1, 0.36, 1];
export const DURATION = 0.34;

export const fadeUp = (y = 14) => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0 },
});

export const transitionFor = (reduce, extra = {}) =>
  (reduce ? { duration: 0 } : { duration: DURATION, ease: EASE, ...extra });

/**
 * Fades its children up once, either on mount (`on="mount"`) or when scrolled
 * into view (default).
 */
export function Reveal({ as = 'div', on = 'view', delay = 0, y = 14, children, ...props }) {
  const reduce = useReducedMotionConfig();
  const Tag = motion[as];
  const trigger = on === 'mount'
    ? { animate: 'show' }
    : { whileInView: 'show', viewport: { once: true, amount: 0.2 } };
  return (
    <Tag
      variants={fadeUp(y)}
      initial={reduce ? false : 'hidden'}
      {...trigger}
      transition={transitionFor(reduce, { delay })}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Counts a number up from 0 to `target`; returns the target directly with reduced motion. */
export function useCountUp(target, { duration = 0.8, delay = 0 } = {}) {
  const reduce = useReducedMotionConfig();
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (reduce) return undefined;
    // Start from wherever we are, so a refreshed server result glides rather than restarting
    const controls = animate(current.current, target, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => { current.current = v; setValue(Math.round(v)); },
    });
    return () => controls.stop();
  }, [target, duration, delay, reduce]);

  return reduce ? target : value;
}

/**
 * Renders `value` counting up from 0, starting when this element mounts (so it stays in step
 * with sibling animations). The count is visual only: assistive tech reads the final value.
 */
export function CountUp({ value, suffix = '', duration, delay, srOnlyClassName }) {
  const shown = useCountUp(value, { duration, delay });
  return (
    <>
      <span aria-hidden="true">{shown}{suffix}</span>
      <span className={srOnlyClassName}>{value}{suffix}</span>
    </>
  );
}
