'use client';

import React, { useEffect, useRef } from 'react';

interface LeafParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  angle: number;
  angularSpeed: number;
  type: 'leaf' | 'petal' | 'dandelion';
  color: string;
  opacity: number;
}

export default function GhibliLeavesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // High-definition Ghibli Autumn watercolor palette (amber, maple red, golden oak)
    const leafColors = [
      '#D95A32', // Rich maple red
      '#E88E2E', // Vibrant autumn amber
      '#EAA838', // Golden foliage yellow
      '#B23824', // Deep crimson
      '#C2783B', // Warm cedar oak
      '#A84D2B', // Terracotta russet
    ];

    const particleCount = Math.min(28, Math.floor(width / 45));
    const particles: LeafParticle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 6,
        speedX: Math.random() * 1.2 + 0.4,
        speedY: Math.random() * 0.8 + 0.3,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.03,
        type: i % 4 === 0 ? 'dandelion' : i % 3 === 0 ? 'petal' : 'leaf',
        color: leafColors[Math.floor(Math.random() * leafColors.length)],
        opacity: Math.random() * 0.5 + 0.35,
      });
    }

    const drawLeaf = (p: LeafParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.type === 'dandelion') {
        // Fluffy seed
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-p.size, -p.size * 0.6);
        ctx.stroke();
      } else {
        // Ghibli pointed oval leaf
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle leaf vein
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-p.size * 1.2, 0);
        ctx.lineTo(p.size * 1.2, 0);
        ctx.stroke();
      }

      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render drifting particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.angularSpeed;

        // Wrap around boundaries
        if (p.x > width + 20) p.x = -20;
        if (p.y > height + 20) p.y = -20;

        drawLeaf(p);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 opacity-75"
    />
  );
}
