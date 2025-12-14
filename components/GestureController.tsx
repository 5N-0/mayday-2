
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

interface GestureControllerProps {
  onGesture: (data: { isOpen: boolean; isPinch: boolean; position: { x: number; y: number }, isDetected: boolean }) => void;
  isGuiVisible: boolean;
}

const GestureController: React.FC<GestureControllerProps> = ({ onGesture, isGuiVisible }) => {
  const webcamRef = useRef<Webcam>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [debugState, setDebugState] = useState<string>("-");
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI...");
  
  // Force camera refresh when returning to tab
  const [cameraKey, setCameraKey] = useState(0);

  // --- Drag & Resize State ---
  // Default values will be overwritten on mount based on screen size
  const [guiPos, setGuiPos] = useState({ x: 24, y: 500 });
  const [guiSize, setGuiSize] = useState({ w: 192, h: 144 });
  const [isInteractive, setIsInteractive] = useState(false); // dragging or resizing

  const dragRef = useRef<{ 
      isDragging: boolean; 
      isResizing: boolean; 
      startX: number; 
      startY: number; 
      startLeft: number; 
      startTop: number;
      startW: number;
      startH: number;
  }>({ 
      isDragging: false, isResizing: false, 
      startX: 0, startY: 0, startLeft: 0, startTop: 0, startW: 0, startH: 0 
  });

  // Set initial position on mount
  useEffect(() => {
      // Logic to replicate "bottom-14 left-6" with responsive size
      const isMobile = window.innerWidth < 768;
      const initialW = isMobile ? 130 : 200; // slightly larger defaults
      const initialH = initialW * 0.75; // 4:3 aspect ratio
      
      const initialX = 24; // left-6
      const initialY = window.innerHeight - initialH - 60; // bottom-14 approx (56px) + margin

      setGuiSize({ w: initialW, h: initialH });
      setGuiPos({ x: initialX, y: initialY });
  }, []);

  // --- Interaction Handlers ---
  const handlePointerDown = (e: React.PointerEvent, action: 'drag' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsInteractive(true);
      dragRef.current = {
          isDragging: action === 'drag',
          isResizing: action === 'resize',
          startX: e.clientX,
          startY: e.clientY,
          startLeft: guiPos.x,
          startTop: guiPos.y,
          startW: guiSize.w,
          startH: guiSize.h
      };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isInteractive) return;
      e.preventDefault();
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      if (dragRef.current.isDragging) {
          setGuiPos({
              x: dragRef.current.startLeft + deltaX,
              y: dragRef.current.startTop + deltaY
          });
      } else if (dragRef.current.isResizing) {
          const newW = Math.max(100, dragRef.current.startW + deltaX);
          const newH = Math.max(75, dragRef.current.startH + deltaY); 
          setGuiSize({ w: newW, h: newH });
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      if (isInteractive) {
          setIsInteractive(false);
          dragRef.current.isDragging = false;
          dragRef.current.isResizing = false;
          (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }
  };

  // --- Logic Refs ---
  const onGestureRef = useRef(onGesture);
  useEffect(() => {
    onGestureRef.current = onGesture;
  }, [onGesture]);

  const lastDetectionTime = useRef(0);
  
  // STABILIZATION REFS
  const ratioHistory = useRef<number[]>([]); 
  const posHistory = useRef<{x:number, y:number}[]>([]); 
  const isCurrentlyOpen = useRef<boolean>(false); 
  
  // Pinch History for smoothing
  const pinchHistory = useRef<boolean[]>([]);

  const missedFrames = useRef(0); 

  // 1. Handle Visibility Change
  useEffect(() => {
      const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
              setTimeout(() => {
                  setCameraKey(prev => prev + 1);
                  setCameraError(false); 
              }, 500);
          }
      };
      
      document.addEventListener("visibilitychange", handleVisibility);
      return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // 2. Load Model
  useEffect(() => {
    let isMounted = true;
    
    const loadModel = async () => {
      try {
        if (isMounted) setLoadingMessage("Connecting to GPU...");
        await (tf as any).ready().catch(() => (tf as any).setBackend('webgl'));
        await (tf as any).ready();
        
        if (isMounted) setLoadingMessage("Downloading AI Model...");
        const net = await handpose.load();
        
        if (isMounted) {
          setModel(net);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load handpose model:", err);
        if (isMounted) {
            setLoadingMessage("AI Unavailable");
            setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
        if (loading && isMounted) {
            setLoadingMessage("Taking longer than expected...");
        }
    }, 6000);

    loadModel();

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
    };
  }, []);

  // 3. Detection Loop
  const runDetection = useCallback(async () => {
    if (model && webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      
      const now = Date.now();
      if (now - lastDetectionTime.current < 100) {
        requestAnimationFrame(runDetection);
        return;
      }
      lastDetectionTime.current = now;

      const video = webcamRef.current.video;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
          requestAnimationFrame(runDetection);
          return;
      }

      try {
        const predictions = await model.estimateHands(video);

        if (predictions.length > 0) {
          missedFrames.current = 0;
          
          const hand = predictions[0];
          const landmarks = hand.landmarks;
          const wrist = landmarks[0];

          if (!wrist) {
              requestAnimationFrame(runDetection);
              return;
          }

          const rawX = -1 * ((wrist[0] / video.videoWidth) * 2 - 1); 
          const rawY = -1 * ((wrist[1] / video.videoHeight) * 2 - 1);
          
          posHistory.current.push({x: rawX, y: rawY});
          if (posHistory.current.length > 8) posHistory.current.shift(); 

          const avgPos = posHistory.current.reduce((acc, curr) => ({ x: acc.x + curr.x, y: acc.y + curr.y }), {x:0, y:0});
          const count = posHistory.current.length;
          const x = avgPos.x / count;
          const y = avgPos.y / count;

          // Helper: 3D Distance
          const getDist = (p1: number[], p2: number[]) => {
             return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
          };

          // --- 1. Open/Close Logic ---
          const tips = [8, 12, 16, 20]; 
          const bases = [5, 9, 13, 17];
          let totalBaseDist = 0;
          let totalTipDist = 0;

          for(let i=0; i<4; i++) {
              totalBaseDist += getDist(wrist, landmarks[bases[i]]);
              totalTipDist += getDist(wrist, landmarks[tips[i]]);
          }

          const avgBaseDist = totalBaseDist / 4;
          const avgTipDist = totalTipDist / 4;
          const rawRatio = avgTipDist / (avgBaseDist || 1);
          
          ratioHistory.current.push(rawRatio);
          if (ratioHistory.current.length > 5) ratioHistory.current.shift();
          const smoothedRatio = ratioHistory.current.reduce((a,b) => a+b, 0) / ratioHistory.current.length;

          if (!isCurrentlyOpen.current && smoothedRatio > 1.6) {
             isCurrentlyOpen.current = true;
          } else if (isCurrentlyOpen.current && smoothedRatio < 1.2) {
             isCurrentlyOpen.current = false;
          }

          const isOpen = isCurrentlyOpen.current;

          // --- 2. Pinch Logic ---
          // Index Tip = 8, Thumb Tip = 4
          // Use Palm Base (0) to Middle Finger Base (9) as scale reference
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const middleBase = landmarks[9];

          const pinchDist = getDist(thumbTip, indexTip);
          const palmScale = getDist(wrist, middleBase);
          
          // Normalized Pinch distance
          const pinchRatio = pinchDist / (palmScale || 1);
          
          // Pinch threshold (experimentally determined)
          const isPinchFrame = pinchRatio < 0.25;
          
          // Simple debounce for pinch
          pinchHistory.current.push(isPinchFrame);
          if (pinchHistory.current.length > 3) pinchHistory.current.shift();
          // Require at least 2/3 frames to be pinch to avoid flicker
          const isPinch = pinchHistory.current.filter(Boolean).length >= 2;

          let displayState = isOpen ? "OPEN" : "CLOSED";
          if (isPinch) displayState = "PINCH 🤏";

          setDebugState(displayState);

          if (onGestureRef.current) {
            onGestureRef.current({ isOpen, isPinch, position: { x, y }, isDetected: true });
          }
        } else {
          missedFrames.current++;
          if (missedFrames.current > 5) {
              isCurrentlyOpen.current = false; 
              ratioHistory.current = []; 
              posHistory.current = []; 
              setDebugState("NO HAND");
              if (onGestureRef.current) {
                onGestureRef.current({ isOpen: false, isPinch: false, position: {x:0, y:0}, isDetected: false });
              }
          }
        }
      } catch (err) {
        // Suppress ephemeral errors
      }
    }
    requestAnimationFrame(runDetection);
  }, [model]);

  useEffect(() => {
    if (model && !loading) {
      const timer = requestAnimationFrame(runDetection);
      return () => cancelAnimationFrame(timer);
    }
  }, [model, loading, runDetection]);

  return (
    <div 
      style={{
          position: 'fixed',
          left: `${guiPos.x}px`,
          top: `${guiPos.y}px`,
          width: `${guiSize.w}px`,
          height: `${guiSize.h}px`,
          touchAction: 'none' // Prevent scrolling while dragging on mobile
      }}
      className={`z-50 transition-opacity duration-500 ease-in-out select-none ${
        isGuiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onPointerDown={(e) => handlePointerDown(e, 'drag')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div 
        className={`relative w-full h-full rounded-lg border-[#d4af37]/50 bg-black/90 border overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)] cursor-move ${isInteractive ? 'scale-[1.02] shadow-[0_0_30px_rgba(212,175,55,0.4)]' : ''} transition-shadow duration-200`}
      >
          {cameraError ? (
             <div className="flex flex-col items-center justify-center h-full text-[#d4af37] p-2 text-center gap-2">
                <span className="text-xl">📷</span>
                <span className="text-[10px] font-luxury uppercase tracking-widest">Tap to Retry</span>
                <button 
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag on click
                    onClick={() => setCameraKey(p => p + 1)}
                    className="px-2 py-1 bg-white/10 rounded text-[9px] hover:bg-white/20 cursor-pointer"
                >
                    Restart
                </button>
             </div>
          ) : (
            <>
                <Webcam
                    key={cameraKey} 
                    ref={webcamRef}
                    mirrored={true}
                    playsInline={true} 
                    muted={true}
                    videoConstraints={{ 
                        facingMode: "user",
                        width: { ideal: 320 },
                        height: { ideal: 240 }
                    }}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-20' : 'opacity-80'} pointer-events-none`}
                    onUserMediaError={() => setCameraError(true)}
                />
                {!loading && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#d4af37]/10 to-transparent animate-scan pointer-events-none" />}
            </>
          )}
          
          {loading && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#d4af37] gap-2 p-4 bg-black/80 backdrop-blur-sm pointer-events-none">
                  <div className="w-5 h-5 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[9px] font-luxury uppercase tracking-widest text-center animate-pulse">{loadingMessage}</span>
              </div>
          )}
          
          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-6 pb-2 px-3 flex flex-row justify-between items-end pointer-events-none">
            <span className="text-[8px] text-[#d4af37]/80 font-luxury tracking-widest uppercase">Sensors</span>
            <span className={`text-[9px] font-mono font-bold ${debugState.includes("PINCH") ? "text-red-400 animate-pulse" : debugState.includes("OPEN") ? "text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-[#d4af37]"}`}>
                {debugState}
            </span>
          </div>

          {/* Resize Handle (Bottom Right) */}
          <div 
            className="absolute bottom-0 right-0 w-6 h-6 z-20 cursor-nwse-resize group flex items-end justify-end p-1"
            onPointerDown={(e) => handlePointerDown(e, 'resize')}
          >
              <div className="w-2 h-2 border-r-2 border-b-2 border-[#d4af37]/50 group-hover:border-[#d4af37] transition-colors rounded-br-[1px]" />
          </div>
      </div>
      
      <style>{`
        @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        .animate-scan {
            animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GestureController;
