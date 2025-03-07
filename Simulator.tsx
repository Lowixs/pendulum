import  { useState, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Grid } from 'lucide-react';
import PendulumCanvas from './PendulumCanvas';
import { PendulumState, SimulationControls } from '../types/simulation';

// Runge-Kutta 4th order integration for more accurate physics
function rk4(state: PendulumState, dt: number, gravity: number, damping: number): [number, number] {
  const f = (theta: number, omega: number): [number, number] => {
    const dtheta = omega;
    const domega = (-gravity / state.length) * Math.sin(theta) - damping * omega;
    return [dtheta, domega];
  };

  const [theta, omega] = [state.angle, state.angularVelocity];
  
  const [k1t, k1v] = f(theta, omega);
  const [k2t, k2v] = f(theta + k1t * dt/2, omega + k1v * dt/2);
  const [k3t, k3v] = f(theta + k2t * dt/2, omega + k2v * dt/2);
  const [k4t, k4v] = f(theta + k3t * dt, omega + k3v * dt);

  const newTheta = theta + (dt/6) * (k1t + 2*k2t + 2*k3t + k4t);
  const newOmega = omega + (dt/6) * (k1v + 2*k2v + 2*k3v + k4v);

  return [newTheta, newOmega];
}

export default function Simulator() {
  const [state, setState] = useState<PendulumState>({
    angle: Math.PI / 4,
    angularVelocity: 0,
    length: 2,
    mass: 1,
    trail: [],
  });

  const [controls, setControls] = useState<SimulationControls>({
    isRunning: true,
    gravity: 9.81,
    damping: 0.5,
    showTrail: true,
  });

  const lastTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const handleFrame = useCallback((deltaTime: number) => {
    if (!controls.isRunning) {
      pausedTimeRef.current = deltaTime;
      return;
    }

    setState((prev) => {
      const dt = deltaTime;
      
      // Update physics
      const [newAngle, newVelocity] = rk4(
        prev,
        dt,
        controls.gravity,
        controls.damping / 100
      );
      
      // Calculate bob position for trail
      const pivotX = 300;
      const pivotY = 125;
      const stringLength = prev.length * 150;
      const bobX = pivotX + Math.sin(newAngle) * stringLength;
      const bobY = pivotY + Math.cos(newAngle) * stringLength;
      
      // Update trail
      const newTrail = [...prev.trail];
      if (controls.showTrail) {
        newTrail.push({ x: bobX, y: bobY });
        while (newTrail.length > 50) newTrail.shift();
      }
      
      return {
        ...prev,
        angle: newAngle,
        angularVelocity: newVelocity,
        trail: newTrail,
      };
    });
  }, [controls]);

  const toggleSimulation = () => {
    setControls(prev => {
      const newIsRunning = !prev.isRunning;
      lastTimeRef.current = newIsRunning ? performance.now() : lastTimeRef.current;
      return { ...prev, isRunning: newIsRunning };
    });
  };

  const resetSimulation = () => {
    setState({
      angle: Math.PI / 4,
      angularVelocity: 0,
      length: 2,
      mass: 1,
      trail: [],
    });
    setControls(prev => ({ ...prev, isRunning: true }));
    lastTimeRef.current = performance.now();
  };

  return (
    <section id="simulator" className="min-h-screen pt-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Interactive Pendulum Simulator</h2>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <PendulumCanvas
              state={state}
              controls={controls}
              onFrame={handleFrame}
            />
            
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={toggleSimulation}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {controls.isRunning ? <Pause className="mr-2" size={20} /> : <Play className="mr-2" size={20} />}
                {controls.isRunning ? 'Pause' : 'Start'}
              </button>
              
              <button
                onClick={resetSimulation}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="mr-2" size={20} />
                Reset
              </button>
              
              <button
                onClick={() => setControls(prev => ({ ...prev, showTrail: !prev.showTrail }))}
                className={`flex items-center px-4 py-2 ${
                  controls.showTrail ? 'bg-blue-600' : 'bg-gray-600'
                } text-white rounded-lg hover:opacity-90 transition-colors`}
              >
                <Grid className="mr-2" size={20} />
                Trail
              </button>
            </div>
          </div>
          
          <div className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                String Length: {state.length.toFixed(1)} m
              </label>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={state.length}
                onChange={(e) => setState(prev => ({ ...prev, length: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mass: {state.mass.toFixed(1)} kg
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={state.mass}
                onChange={(e) => setState(prev => ({ ...prev, mass: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Air Resistance: {controls.damping.toFixed(1)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={controls.damping}
                onChange={(e) => setControls(prev => ({ ...prev, damping: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gravity: {controls.gravity.toFixed(2)} m/s²
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.1"
                value={controls.gravity}
                onChange={(e) => setControls(prev => ({ ...prev, gravity: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Physics Information</h3>
              <p className="text-sm text-blue-800">
                Period ≈ {(2 * Math.PI * Math.sqrt(state.length / controls.gravity)).toFixed(2)} seconds
              </p>
              <p className="text-sm text-blue-800">
                Max Speed ≈ {(Math.sqrt(2 * controls.gravity * state.length) * (1 - Math.cos(state.angle))).toFixed(2)} m/s
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
 