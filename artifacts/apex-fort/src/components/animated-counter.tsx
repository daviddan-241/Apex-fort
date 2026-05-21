import { useEffect, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  label: string;
  duration?: number;
}

export function AnimatedCounter({ value, label, duration = 1.5 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;

    const end = value;
    const totalSteps = Math.min(end, 60);
    const stepTime = Math.abs(Math.floor((duration * 1000) / totalSteps));
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep += 1;
      const progress = currentStep / totalSteps;
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(end * easeProgress));
      if (currentStep >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration, isInView]);

  return (
    <div ref={ref} className="flex flex-col border border-border bg-card/50 p-6 rounded-lg relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="text-4xl font-display font-bold text-primary mb-1">
        {count.toString().padStart(2, '0')}
      </div>
      <div className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}