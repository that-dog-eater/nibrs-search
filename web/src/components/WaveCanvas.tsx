
"use client";

import { useEffect, useRef } from "react";

export function WaveCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let frame = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Three waves, each drawn as a simple sine wave along a diagonal band
    const WAVES = [
      { yFrac: 0.38, amp: 55, freq: 0.012, speed: 0.004, lw: 2.0, alpha: 0.22, r: 37,  g: 99,  b: 235 },
      { yFrac: 0.52, amp: 40, freq: 0.009, speed: 0.003, lw: 1.4, alpha: 0.13, r: 96,  g: 165, b: 250 },
      { yFrac: 0.64, amp: 65, freq: 0.015, speed: 0.005, lw: 3.0, alpha: 0.08, r: 147, g: 197, b: 253 },
    ];

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const w of WAVES) {
        ctx.beginPath();
        ctx.lineWidth = w.lw;
        ctx.strokeStyle = `rgba(${w.r},${w.g},${w.b},${w.alpha})`;
        ctx.lineJoin = "round";

        for (let px = 0; px <= W; px += 3) {
          // Base Y: a diagonal line going from top-right to bottom-left
          const baseY = H * w.yFrac + (px / W) * H * 0.35 - H * 0.17;
          const y = baseY + Math.sin(px * w.freq + frame * w.speed) * w.amp
                          + Math.sin(px * w.freq * 0.5 - frame * w.speed * 0.7) * w.amp * 0.4;
          if (px === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }

      frame++;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}