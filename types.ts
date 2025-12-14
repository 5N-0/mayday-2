import { ThreeElements } from '@react-three/fiber';

export type TreeState = 'CHAOS' | 'FORMED';

export interface TreeColors {
  bottom: string;
  top: string;
}

export interface HandGesture {
  isOpen: boolean;
  position: { x: number; y: number }; // Normalized -1 to 1
  isDetected: boolean;
}

// NOTE: We removed the manual JSX augmentation here because it was overwriting 
// React's default IntrinsicElements (div, span, etc.), causing errors.
// @react-three/fiber automatically augments JSX.IntrinsicElements when imported.
