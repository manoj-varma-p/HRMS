"use client";

import { useEffect, useState, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) setIsVisible(true);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest('[role="button"]') ||
        target.closest('[data-slot="select-trigger"]') ||
        window.getComputedStyle(target).cursor === "pointer"
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("mouseover", handleMouseOver);

    let animationFrameId: number;

    const render = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      // Smooth lag effect for the outer ring
      const ease = 0.16;
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      window.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Center invert-color dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white transition-transform duration-75 ease-out"
        style={{ mixBlendMode: "difference" }}
      />
      {/* Trailing blur-ring */}
      <div
        ref={ringRef}
        className={`pointer-events-none fixed top-0 left-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 transition-all duration-300 ease-out-expo ${
          isHovered
            ? "h-11 w-11 bg-white/10 border-white/60 scale-105"
            : "h-6 w-6"
        }`}
        style={{
          transitionProperty: "width, height, background-color, border-color, transform",
        }}
      />
    </>
  );
}
