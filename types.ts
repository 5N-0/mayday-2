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

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}