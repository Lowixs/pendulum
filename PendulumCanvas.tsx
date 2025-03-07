import  { useEffect, useRef } from 'react';
import { PendulumState, SimulationControls } from '../types/simulation';

interface PendulumCanvasProps {
  state: PendulumState;
  controls: SimulationControls;
  onFrame: (deltaTime: number) => void;
}

export default function PendulumCanvas({ state, controls, onFrame }: PendulumCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Enable image smoothing for better rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set display size
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale all drawing operations by dpr
    ctx.scale(dpr, dpr);

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.017); // Cap at ~60fps
      lastTimeRef.current = currentTime;

      if (controls.isRunning) {
        onFrame(deltaTime);
      }

      // Clear with background color instead of clearRect for better performance
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid with reduced opacity
      ctx.strokeStyle = 'rgba(240, 240, 240, 0.8)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      
      for (let i = 0; i <= rect.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, rect.height);
        ctx.stroke();
      }
      for (let i = 0; i <= rect.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(rect.width, i);
        ctx.stroke();
      }

      // Draw pivot mount with shadow
      const pivotX = rect.width / 2;
      const pivotY = rect.height / 4;
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#475569';
      ctx.fillRect(pivotX - 40, 0, 80, pivotY - 10);
      ctx.shadowColor = 'transparent';
      
      // Draw pivot point with gradient
      const pivotGradient = ctx.createRadialGradient(
        pivotX, pivotY, 0,
        pivotX, pivotY, 8
      );
      pivotGradient.addColorStop(0, '#2563eb');
      pivotGradient.addColorStop(1, '#1e3a8a');
      
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
      ctx.fillStyle = pivotGradient;
      ctx.fill();
      
      // Calculate bob position
      const stringLength = state.length * 150;
      const bobX = pivotX + Math.sin(state.angle) * stringLength;
      const bobY = pivotY + Math.cos(state.angle) * stringLength;

      // Draw string with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowColor = 'transparent';

      // Draw trajectory with smooth gradient
      if (controls.showTrail && state.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(state.trail[0].x, state.trail[0].y);
        
        // Use quadratic curves for smoother trail
        for (let i = 1; i < state.trail.length - 1; i++) {
          const xc = (state.trail[i].x + state.trail[i + 1].x) / 2;
          const yc = (state.trail[i].y + state.trail[i + 1].y) / 2;
          ctx.quadraticCurveTo(state.trail[i].x, state.trail[i].y, xc, yc);
        }
        
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw bob with enhanced gradient and shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      
      const gradient = ctx.createRadialGradient(
        bobX - state.mass * 5, bobY - state.mass * 5, 0,
        bobX, bobY, state.mass * 25
      );
      gradient.addColorStop(0, '#60a5fa');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#1d4ed8');

      ctx.beginPath();
      ctx.arc(bobX, bobY, state.mass * 25, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add highlight
      const highlightGradient = ctx.createRadialGradient(
        bobX - state.mass * 10, bobY - state.mass * 10, 0,
        bobX - state.mass * 10, bobY - state.mass * 10, state.mass * 10
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(bobX - state.mass * 10, bobY - state.mass * 10, state.mass * 10, 0, Math.PI * 2);
      ctx.fillStyle = highlightGradient;
      ctx.fill();

      // Draw energy indicator with gradient
      const energy = calculateEnergy(state, controls.gravity);
      const maxEnergy = calculateMaxEnergy(state, controls.gravity);
      const energyHeight = (energy / maxEnergy) * 100;
      
      // Background
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(20, rect.height - 120, 20, 100);
      
      // Energy bar with gradient
      const energyGradient = ctx.createLinearGradient(
        20, rect.height - 120,
        20, rect.height - 20
      );
      energyGradient.addColorStop(0, '#3b82f6');
      energyGradient.addColorStop(1, '#1d4ed8');
      
      ctx.fillStyle = energyGradient;
      ctx.fillRect(20, rect.height - 20 - energyHeight, 20, energyHeight);
      
      // Energy label with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 2;
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('Energy', 10, rect.height - 130);
      ctx.shadowColor = 'transparent';

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [state, controls, onFrame]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={500}
      className="bg-white rounded-lg shadow-lg w-full"
    />
  );
}

function calculateEnergy(state: PendulumState, gravity: number): number {
  const kineticEnergy = 0.5 * state.mass * Math.pow(state.angularVelocity * state.length, 2);
  const potentialEnergy = state.mass * gravity * state.length * (1 - Math.cos(state.angle));
  return kineticEnergy + potentialEnergy;
}

function calculateMaxEnergy(state: PendulumState, gravity: number): number {
  return 2 * state.mass * gravity * state.length;
}
 