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
  duration = 2.2,
  spread = 2.5,
  baseColor,
  shimmerColor,
  style,
}: TextShimmerProps) {
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements,
  );

  const dynamicSpread = useMemo(
    () => Math.min(children.length * spread, 120),
    [children.length, spread],
  );

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-clip-text",
        "[-webkit-text-fill-color:transparent]",
        "[background-repeat:no-repeat,padding-box]",
        className,
      )}
      initial={{ backgroundPosition: "180% 50%", skewX: 0 }}
      animate={{
        backgroundPosition: ["180% 50%", "55% 48%", "-40% 52%"],
        skewX: [0, -1.5, 0, 1.5, 0],
      }}
      transition={{
        repeat: Infinity,
        duration,
        ease: [0.37, 0, 0.63, 1],
        times: [0, 0.5, 1],
      }}
      style={
        {
          ...style,
          backgroundSize: "280% 100%, 100% 100%",
          backgroundImage: `linear-gradient(112deg, transparent calc(50% - ${dynamicSpread}px), ${shimmerColor ?? "currentColor"} 50%, transparent calc(50% + ${dynamicSpread}px)), linear-gradient(${baseColor ?? "color-mix(in oklab, currentColor 35%, transparent)"}, ${baseColor ?? "color-mix(in oklab, currentColor 35%, transparent)"})`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);
