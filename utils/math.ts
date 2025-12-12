import * as THREE from 'three';

export const randomVector3 = (r: number) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export const getConePosition = (height: number, radius: number, progress: number) => {
  const y = (progress - 0.5) * height; // -height/2 to height/2
  const r = (1 - progress) * radius; // Taper to top
  const angle = Math.random() * Math.PI * 2;
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle);
  return new THREE.Vector3(x, y, z);
};

// Returns { target: Float32Array, chaos: Float32Array, randoms: Float32Array }
export const generateFoliageData = (count: number, treeHeight: number, treeRadius: number) => {
  const target = new Float32Array(count * 3);
  const chaos = new Float32Array(count * 3);
  const randoms = new Float32Array(count); // For size variation and snow mask

  for (let i = 0; i < count; i++) {
    // Tree Shape (Target)
    // FIX: Use Inverse CDF for Cone Surface Area distribution: 1 - sqrt(random)
    // This pushes significantly more density to the bottom (progress near 0)
    // progress 0 = bottom, 1 = top.
    const r = Math.random();
    const progress = 1 - Math.sqrt(Math.random()); 
    
    const posT = getConePosition(treeHeight, treeRadius, progress);
    
    // Add volume noise (fluffiness)
    posT.x += (Math.random() - 0.5) * 1.0;
    posT.z += (Math.random() - 0.5) * 1.0;
    posT.y += (Math.random() - 0.5) * 1.0;

    target[i * 3] = posT.x;
    target[i * 3 + 1] = posT.y;
    target[i * 3 + 2] = posT.z;

    // Chaos Shape (Exploded)
    const posC = randomVector3(treeHeight * 1.5);
    chaos[i * 3] = posC.x;
    chaos[i * 3 + 1] = posC.y;
    chaos[i * 3 + 2] = posC.z;
    
    randoms[i] = Math.random();
  }

  return { target, chaos, randoms };
};

export const generateSpiralData = (count: number, height: number, radius: number, turns: number) => {
  const target = new Float32Array(count * 3);
  const chaos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const t = i / count; // 0 to 1
    
    // Spiral Math
    const y = (t - 0.5) * height;
    const r = (1 - t) * radius + 0.5; // Slight offset so it sits on leaves
    const angle = t * Math.PI * 2 * turns;

    target[i * 3] = r * Math.cos(angle);
    target[i * 3 + 1] = y;
    target[i * 3 + 2] = r * Math.sin(angle);

    // Chaos
    const posC = randomVector3(height * 1.2);
    chaos[i * 3] = posC.x;
    chaos[i * 3 + 1] = posC.y;
    chaos[i * 3 + 2] = posC.z;
  }
  return { target, chaos };
};

export const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};