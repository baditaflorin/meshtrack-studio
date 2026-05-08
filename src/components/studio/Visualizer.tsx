import { useEffect, useRef } from "react";

type VisualizerProps = {
  getAnalyserData: () => Float32Array;
  isActive: boolean;
};

export function Visualizer({ getAnalyserData, isActive }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      const data = getAnalyserData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      
      if (data.length === 0) {
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#00f2ff"; // Cyberpunk cyan
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00f2ff";

      const sliceWidth = width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = data[i];
        const y = (v * height) / 2 + height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      requestRef.current = requestAnimationFrame(animate);
    };

    if (isActive) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [getAnalyserData, isActive]);

  return (
    <div className="visualizer-container">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={100} 
        style={{ width: "100%", height: "100px", borderRadius: "8px", background: "rgba(0,0,0,0.2)" }}
      />
    </div>
  );
}
