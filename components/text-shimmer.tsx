"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  baseColor?: string;
  shimmerColor?: string;
  style?: React.CSSProperties;
};

function TextShimmerComponent({
  children,
  as: Component = "span",
  className,
  duration = 2.4,
  baseColor = "#6f7883",
  shimmerColor = "#dce5ee",
  style,
}: TextShimmerProps) {
  const MotionComponent = motion.create(Component);
  return (
    <MotionComponent
      className={cn("wk-shimmer-text", className)}
      initial={{ backgroundPosition: "180% 50%" }}
      animate={{ backgroundPosition: ["180% 50%", "50% 50%", "-80% 50%"] }}
      transition={{ repeat: Infinity, duration, ease: [0.4, 0, 0.2, 1], times: [0, 0.5, 1] }}
      style={{
        ...style,
        backgroundImage: `linear-gradient(105deg, ${baseColor} 0%, ${baseColor} 44%, ${shimmerColor} 50%, ${baseColor} 56%, ${baseColor} 100%)`,
        backgroundSize: "240% 100%",
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      } as React.CSSProperties}
    >
      {children}
    </MotionComponent>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);
