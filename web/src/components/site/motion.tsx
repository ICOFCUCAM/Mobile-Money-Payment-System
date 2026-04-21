import React, { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';

export const FadeIn: React.FC<
  React.PropsWithChildren<{ delay?: number; className?: string; y?: number }>
> = ({ children, delay = 0, className, y = 14 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const AnimatedNumber: React.FC<{
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}> = ({ to, prefix = '', suffix = '', decimals = 0, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1.4, bounce: 0 });
  const rounded = useTransform(spring, (v) =>
    `${prefix}${Number(v).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}${suffix}`
  );
  useEffect(() => { if (inView) mv.set(to); }, [inView, to, mv]);
  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
};
