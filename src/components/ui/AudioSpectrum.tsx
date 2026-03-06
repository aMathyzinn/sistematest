'use client';

import { useEffect, useRef } from 'react';
import { getAnalyser } from '@/lib/audio';

interface AudioSpectrumProps {
  /** Bar colour — default accent purple */
  color?: string;
  /** Mirror bars (left + right symmetry) */
  mirror?: boolean;
  className?: string;
}

export default function AudioSpectrum({
  color = '#a78bfa',
  mirror = true,
  className = '',
}: AudioSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      const analyser = getAnalyser();
      const W = canvas.width;
      const H = canvas.height;

      ctx2d.clearRect(0, 0, W, H);

      if (!analyser) return;

      const bufferLength = analyser.frequencyBinCount; // fftSize / 2 = 128
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Only use the lower 80 bins — speech sits there
      const usedBins = Math.min(80, bufferLength);
      const barCount = mirror ? Math.floor(usedBins / 2) : usedBins;
      const barW = W / (mirror ? barCount * 2 : barCount);
      const gap = Math.max(1, barW * 0.2);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i] / 255;
        const barH = value * H * 0.9;
        if (barH < 1) continue;

        const alpha = 0.25 + value * 0.65;
        ctx2d.fillStyle = color;
        ctx2d.globalAlpha = alpha;

        const x1 = mirror ? (barCount - 1 - i) * barW + gap / 2 : i * barW + gap / 2;
        const w = barW - gap;

        // Rounded top
        const radius = Math.min(w / 2, 4);
        const y = H - barH;

        ctx2d.beginPath();
        ctx2d.moveTo(x1 + radius, y);
        ctx2d.lineTo(x1 + w - radius, y);
        ctx2d.quadraticCurveTo(x1 + w, y, x1 + w, y + radius);
        ctx2d.lineTo(x1 + w, H);
        ctx2d.lineTo(x1, H);
        ctx2d.lineTo(x1, y + radius);
        ctx2d.quadraticCurveTo(x1, y, x1 + radius, y);
        ctx2d.closePath();
        ctx2d.fill();

        if (mirror) {
          const x2 = (barCount + i) * barW + gap / 2;
          ctx2d.beginPath();
          ctx2d.moveTo(x2 + radius, y);
          ctx2d.lineTo(x2 + w - radius, y);
          ctx2d.quadraticCurveTo(x2 + w, y, x2 + w, y + radius);
          ctx2d.lineTo(x2 + w, H);
          ctx2d.lineTo(x2, H);
          ctx2d.lineTo(x2, y + radius);
          ctx2d.quadraticCurveTo(x2, y, x2 + radius, y);
          ctx2d.closePath();
          ctx2d.fill();
        }
      }

      ctx2d.globalAlpha = 1;
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [color, mirror]);

  // Keep canvas pixel-perfect on resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) ctx2d.scale(window.devicePixelRatio, window.devicePixelRatio);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
