export  interface PendulumState {
  angle: number;
  angularVelocity: number;
  length: number;
  mass: number;
  trail: Array<{ x: number; y: number }>;
}

export interface SimulationControls {
  isRunning: boolean;
  gravity: number;
  damping: number;
  showTrail: boolean;
}
 