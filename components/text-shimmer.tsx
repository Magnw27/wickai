"use client";

import React, { useMemo, type JSX } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  baseColor?: string;
  shimmerColor?: string;
  style?: React.CSSProperties;
};

function TextShimmerComponent({
  children,
  as: Component = "p",
  className,
  duration = 2.8,
  spread = 1.4,
  baseColor = "#7c818b",
  shimmerColor = "#f4f4f5",
  style,
}: TextShimmerProps) {
  const MotionComponent = motion.create(Component as keyof JSX.IntrinsicElements);
  const dynamicSpread = useMemo(() => Math.max(18, Math.min(children.length * spread, 72)), [children.length, spread]);
  return (
    <MotionComponent
      className={cn("wick-text-shimmer relative inline-block bg-clip-text", className)}
      initial={{ backgroundPosition: "160% 50%" }}
      animate={{ backgroundPosition: ["160% 50%", "50% 50%", "-60% 50%"] }}
      transition={{ repeat: Infinity, duration, ease: [0.4, 0, 0.2, 1], times: [0, 0.5, 1] }}
      style={{ ...style, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundRepeat: "no-repeat", backgroundSize: "260% 100%", backgroundImage: `linear-gradient(105deg, ${baseColor} 0%, ${baseColor} 43%, ${shimmerColor} 50%, ${baseColor} 57%, ${baseColor} 100%)`, "--wick-shimmer-spread": `${dynamicSpread}px` } as React.CSSProperties}
    >
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);
