import React, { useEffect, useRef, useState } from 'react';
import { PosterArtType } from '../types/horror';
import { drawPixelHeart } from '../utils/pixelSprites';

interface PosterCanvasProps {
  artType: PosterArtType;
  customPosterUrl?: string;
  isHovered?: boolean;
  className?: string;
}

export const PosterCanvas: React.FC<PosterCanvasProps> = ({
  artType,
  customPosterUrl,
  isHovered = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    setImgError(false);
  }, [customPosterUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    const W = 80;
    const H = 112;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      const glitchShift = isHovered && frame % 11 === 0 ? (Math.random() > 0.5 ? 2 : -2) : 0;

      if (artType === 'silent_fog') {
        // Silent Hill Fog & Siren Tower
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#1e2426');
        g.addColorStop(0.6, '#374144');
        g.addColorStop(1, '#090b0c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Siren tower silhouette
        ctx.fillStyle = '#0f1315';
        ctx.fillRect(36 + glitchShift, 22, 8, 65);
        ctx.fillRect(30 + glitchShift, 20, 20, 5);
        ctx.fillRect(33 + glitchShift, 14, 14, 5);
        // Red warning beacon
        ctx.fillStyle = frame % 30 < 15 ? '#ef4444' : '#7f1d1d';
        ctx.fillRect(39 + glitchShift, 11, 2, 3);

        // Rolling fog layers
        ctx.fillStyle = 'rgba(203, 213, 225, 0.24)';
        const f1 = (frame * 0.3) % W;
        ctx.fillRect(f1 - 30, 54, 65, 10);
        ctx.fillRect(W - f1 - 20, 72, 60, 12);

        // Two tiny silhouettes holding hands in the fog
        ctx.fillStyle = '#050607';
        ctx.fillRect(34, 82, 4, 12);
        ctx.fillRect(41, 80, 5, 14);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(39, 86, 2, 2);
      } else if (artType === 'occult_attic') {
        // Hereditary Attic & Cult Sigil
        ctx.fillStyle = '#0c0609';
        ctx.fillRect(0, 0, W, H);

        // Triangular attic rafters
        ctx.strokeStyle = '#3b1119';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, 95);
        ctx.lineTo(40, 14);
        ctx.lineTo(74, 95);
        ctx.closePath();
        ctx.stroke();

        // Glowing crimson crown / sigil
        ctx.fillStyle = isHovered ? '#ef4444' : '#991b1b';
        ctx.fillRect(28 + glitchShift, 48, 24, 3);
        ctx.fillRect(28 + glitchShift, 41, 3, 7);
        ctx.fillRect(38 + glitchShift, 38, 4, 10);
        ctx.fillRect(49 + glitchShift, 41, 3, 7);

        // Miniature house below
        ctx.fillStyle = '#271218';
        ctx.fillRect(26, 68, 28, 22);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(37, 75, 6, 8);
      } else if (artType === 'forest_witch') {
        // The Witch: Blood Moon & Dark Woods
        ctx.fillStyle = '#080b09';
        ctx.fillRect(0, 0, W, H);

        // Huge Blood Moon
        ctx.fillStyle = isHovered ? '#dc2626' : '#991b1b';
        ctx.fillRect(22, 18, 36, 36);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(26, 22, 28, 28);

        // Dead tree trunks across moon
        ctx.fillStyle = '#050706';
        [10, 22, 35, 48, 62, 70].forEach((tx, idx) => {
          ctx.fillRect(tx, 10 + (idx % 2) * 8, 5, H);
        });

        // Horned shadow silhouette with glowing eyes
        ctx.fillStyle = '#020203';
        ctx.fillRect(33 + glitchShift, 64, 14, 28);
        ctx.fillRect(28 + glitchShift, 56, 5, 9);
        ctx.fillRect(47 + glitchShift, 56, 5, 9);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(36 + glitchShift, 68, 2, 2);
        ctx.fillRect(42 + glitchShift, 68, 2, 2);
      } else if (artType === 'cursed_well') {
        // The Ring: Cursed Eclipse Well & Static
        ctx.fillStyle = '#05080d';
        ctx.fillRect(0, 0, W, H);

        // Glowing White Ring
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.arc(40 + glitchShift, 48, 21, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#05080d';
        ctx.beginPath();
        ctx.arc(40, 48, 18, 0, Math.PI * 2);
        ctx.fill();

        // Stone well below
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(20, 76, 40, 22);
        // Long black hair creeping out of the well
        ctx.fillStyle = '#020617';
        ctx.fillRect(31, 72, 18, 28);
        if (isHovered) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(39, 77, 3, 3); // Pale single eye!
        }
      } else if (artType === 'found_footage') {
        // Blair Witch Camcorder Night-Vision & Stick Effigy
        ctx.fillStyle = '#07140c';
        ctx.fillRect(0, 0, W, H);

        // Camcorder REC indicator
        if (frame % 36 < 22) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(8, 8, 4, 4);
        }
        ctx.fillStyle = '#86efac';
        ctx.fillRect(6, 6, 10, 1);
        ctx.fillRect(6, 6, 1, 10);
        ctx.fillRect(W - 16, 6, 10, 1);
        ctx.fillRect(W - 7, 6, 1, 10);
        ctx.fillRect(6, H - 7, 10, 1);
        ctx.fillRect(6, H - 16, 1, 10);
        ctx.fillRect(W - 16, H - 7, 10, 1);
        ctx.fillRect(W - 7, H - 16, 1, 10);

        // Stick effigy in the center
        ctx.fillStyle = '#bbf7d0';
        ctx.fillRect(39 + glitchShift, 24, 2, 54);
        ctx.fillRect(22 + glitchShift, 38, 36, 2);
        ctx.fillRect(28 + glitchShift, 54, 24, 2);
        ctx.fillRect(26 + glitchShift, 40, 2, 22);
        ctx.fillRect(52 + glitchShift, 40, 2, 22);
      } else if (artType === 'mansion_corridor') {
        // The Shining Room 237 Corridor in Perspective
        ctx.fillStyle = '#18070b';
        ctx.fillRect(0, 0, W, H);

        // Perspective walls
        ctx.strokeStyle = '#4c0519';
        ctx.lineWidth = 1;
        ctx.strokeRect(24, 30, 32, 48);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(24, 30);
        ctx.moveTo(W, 0);
        ctx.lineTo(56, 30);
        ctx.moveTo(0, H);
        ctx.lineTo(24, 78);
        ctx.moveTo(W, H);
        ctx.lineTo(56, 78);
        ctx.stroke();

        // Red door at the end of the corridor
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(33 + glitchShift, 38, 14, 40);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(44 + glitchShift, 58, 2, 2);

        // Twin silhouettes in the hallway on hover!
        if (isHovered || frame % 120 > 95) {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(31, 60, 6, 16);
          ctx.fillRect(43, 60, 6, 16);
        }
      } else if (artType === 'spencer_manor') {
        // Gothic Mansion & Crimson Lightning
        ctx.fillStyle = '#0d060a';
        ctx.fillRect(0, 0, W, H);

        // Crimson sky flash
        ctx.fillStyle = isHovered ? '#7f1d1d' : '#3b0a14';
        ctx.fillRect(0, 0, W, 62);

        // Mansion silhouette
        ctx.fillStyle = '#070509';
        ctx.fillRect(14, 40, 52, 56);
        ctx.fillRect(28, 20, 24, 24);
        // Glowing yellow/red windows
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(36, 28, 8, 10);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(22, 52, 8, 12);
        ctx.fillRect(50, 52, 8, 12);
      } else if (artType === 'unholy_cross') {
        // FAITH: The Unholy Trinity — Stark Black & Crimson Pixel Cross
        ctx.fillStyle = '#040305';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = isHovered ? '#ef4444' : '#b91c1c';
        ctx.fillRect(36 + glitchShift, 18, 8, 72);
        ctx.fillRect(20 + glitchShift, 34, 40, 8);

        // Pixelated aura dots around cross
        ctx.fillStyle = '#7f1d1d';
        for (let i = 0; i < 16; i++) {
          const rx = 14 + ((i * 19 + frame) % 52);
          const ry = 14 + ((i * 29) % 80);
          ctx.fillRect(rx, ry, 2, 2);
        }
      } else {
        // Secret Couple Poster
        ctx.fillStyle = '#14050a';
        ctx.fillRect(0, 0, W, H);
        drawPixelHeart(ctx, 40, 48, '#ef4444');
      }

      // VHS Horizontal Tracking Glitch Bar on Hover
      if (isHovered) {
        const barY = (frame * 2.2) % H;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(0, barY, W, 4);
        ctx.fillStyle = 'rgba(220, 38, 38, 0.22)';
        ctx.fillRect(0, (barY + 35) % H, W, 2);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [artType, isHovered]);

  return (
    <div className={`relative overflow-hidden bg-[#060409] ${className}`}>
      {customPosterUrl && !imgError ? (
        <img
          src={
            customPosterUrl === '/couple-reference.jpg'
              ? './couple-reference.jpg'
              : customPosterUrl
          }
          alt="Pôster do Filme"
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-105 contrast-125 brightness-90' : 'contrast-110 brightness-75'
          }`}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={80}
          height={112}
          className="w-full h-full object-cover pixelated block"
        />
      )}

      {/* CRT Scanline & Aged VHS Vignette Overlay */}
      <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-55" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.88)]" />
    </div>
  );
};
