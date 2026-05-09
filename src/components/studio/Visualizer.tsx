import { useCallback, useEffect, useRef } from "react";

type VisualizerProps = {
  getAnalyserData: () => Float32Array;
  isActive: boolean;
};

export function Visualizer({ getAnalyserData, isActive }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // Stable ref to avoid re-creating the RAF loop on every render
  const getDataRef = useRef(getAnalyserData);
  useEffect(() => {
    getDataRef.current = getAnalyserData;
  }, [getAnalyserData]);

  const startLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const data = getDataRef.current();
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (data.length > 0) {
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, "rgba(0, 242, 255, 0.8)");
        grad.addColorStop(0.5, "rgba(72, 219, 181, 0.8)");
        grad.addColorStop(1, "rgba(0, 242, 255, 0.8)");

        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = grad;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "#00f2ff";

        const sliceW = w / data.length;
        let x = 0;
        for (let i = 0; i < data.length; i++) {
          const y = (data[i] * h) / 2 + h / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceW;
        }
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (isActive) {
      startLoop();
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        // Clear canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, startLoop]);

  return (
    <div className="visualizer-container">
      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        style={{
          width: "100%",
          height: "100px",
          borderRadius: "8px",
          background: "rgba(0,0,0,0.3)",
        }}
        aria-label="Audio waveform visualizer"
      />
    </div>
  );
}
