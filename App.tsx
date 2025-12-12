
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Experience from './components/Experience';
import GestureController from './components/GestureController';
import { TreeColors, HandGesture } from './types';

const App: React.FC = () => {
  // 1 = Formed, 0 = Chaos.
  const [targetMix, setTargetMix] = useState(1); 
  // Default colors kept, UI control removed
  const [colors] = useState<TreeColors>({ bottom: '#022b1c', top: '#217a46' });
  
  // inputRef now tracks detection state for physics switching
  const inputRef = useRef({ x: 0, y: 0, isDetected: false });
  
  // Image Upload State
  const [userImages, setUserImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature Modal State
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Camera Gui Visibility
  const [showCamera, setShowCamera] = useState(true);

  // Wrap in useCallback to prevent new function creation on every render
  const handleGesture = useCallback((data: HandGesture) => {
    if (data.isDetected) {
        const newTarget = data.isOpen ? 0 : 1;
        setTargetMix(prev => {
            if (prev !== newTarget) return newTarget;
            return prev;
        });
        
        inputRef.current = { 
            x: data.position.x * 1.2, 
            y: data.position.y,
            isDetected: true
        };
    } else {
        // Mark as not detected, keep last position to avoid jumps before fade out
        inputRef.current.isDetected = false;
    }
  }, []);

  const toggleState = () => {
      setTargetMix(prev => prev === 1 ? 0 : 1);
  };

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleSignatureClick = () => {
      // Pick a random photo if available, else null (placeholder)
      if (userImages.length > 0) {
          const randomImg = userImages[Math.floor(Math.random() * userImages.length)];
          setActivePhotoUrl(randomImg);
      } else {
          setActivePhotoUrl(null);
      }
      setIsSignatureOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsProcessing(true);
          
          // 1. Immediately disperse the tree (Chaos State) behind the loading screen
          setTargetMix(0);
          
          // Defer processing to next tick to allow React to render the loading screen first
          setTimeout(() => {
              const files = Array.from(e.target.files!).slice(0, 30); // Limit to 30
              const urls = files.map(file => URL.createObjectURL(file));
              
              setUserImages(prev => {
                  // Revoke old URLs to prevent memory leaks
                  prev.forEach(url => URL.revokeObjectURL(url));
                  return urls;
              });

              // Reset input
              if (fileInputRef.current) fileInputRef.current.value = '';

              // Keep loader visible for a moment to cover the texture upload stutter
              setTimeout(() => {
                  setIsProcessing(false);
                  
                  // 2. Trigger the "Ritual" Assembly Animation
                  // Wait a brief moment after loader vanishes so user sees the scattered photos,
                  // then fly them into position.
                  setTimeout(() => {
                      setTargetMix(1);
                  }, 800);

              }, 1200); 
          }, 50);
      }
  };

  // Unified Icon Button Style - Premium Silver Glassmorphism (Circular)
  const iconButtonClass = `
    group relative 
    w-10 h-10 md:w-12 md:h-12
    rounded-full 
    bg-black/30 backdrop-blur-md 
    border border-white/20 
    text-slate-300 
    transition-all duration-500 ease-out 
    hover:border-white/60 hover:text-white hover:bg-white/10 
    hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] 
    active:scale-90 active:bg-white/20
    flex justify-center items-center cursor-pointer
  `;

  // Standard Text Button for Modal
  const textButtonClass = `
    group relative 
    w-auto px-8 h-10
    overflow-hidden rounded-sm 
    bg-black/80 backdrop-blur-md 
    border border-white/40 
    text-slate-300 font-luxury text-[11px] uppercase tracking-[0.25em] 
    transition-all duration-500 ease-out 
    hover:border-white/80 hover:text-black hover:bg-white 
    hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] 
    active:scale-95
    flex justify-center items-center cursor-pointer
  `;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* LOADING OVERLAY */}
      {isProcessing && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-500 animate-in fade-in">
              <div className="relative w-16 h-16 mb-6">
                  {/* Outer Ring */}
                  <div className="absolute inset-0 border-2 border-t-[#d4af37] border-r-transparent border-b-[#d4af37] border-l-transparent rounded-full animate-spin"></div>
                  {/* Inner Ring */}
                  <div className="absolute inset-2 border-2 border-t-transparent border-r-white/30 border-b-transparent border-l-white/30 rounded-full animate-spin-reverse"></div>
                  {/* Center Star */}
                  <div className="absolute inset-0 flex items-center justify-center text-[#d4af37] text-xl animate-pulse">✦</div>
              </div>
              <div className="text-[#d4af37] font-luxury tracking-[0.25em] text-xs uppercase animate-pulse">
                  圣诞树装饰中...
              </div>
              <style>{`
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-spin-reverse {
                    animation: spin-reverse 2s linear infinite;
                }
              `}</style>
          </div>
      )}

      {/* CENTER TITLE - Ethereal Silver Script */}
      {/* Layer: z-0 (Background layer, behind the tree) */}
      <div className={`absolute top-[5%] left-0 w-full flex justify-center pointer-events-none z-0 transition-opacity duration-700 ${isSignatureOpen ? 'opacity-0' : 'opacity-100'}`}>
        <h1 
            className="font-script text-6xl md:text-9xl text-center leading-[1.5] py-10"
            style={{
                // Silver Metallic Gradient
                background: 'linear-gradient(to bottom, #ffffff 20%, #e8e8e8 50%, #b0b0b0 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                // 3D Depth Shadows + Glow
                filter: 'drop-shadow(0px 5px 5px rgba(0,0,0,0.8)) drop-shadow(0px 0px 20px rgba(255,255,255,0.4))'
            }}
        >
            Merry Christmas
        </h1>
      </div>

      {/* 3D Scene */}
      {/* Layer: z-10 (Foreground layer, tree renders on top of text) */}
      <div className={`absolute inset-0 z-10 transition-all duration-700 ${isSignatureOpen ? 'blur-sm scale-95 opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        <Experience 
            mixFactor={targetMix}
            colors={colors} 
            inputRef={inputRef} 
            userImages={userImages}
            signatureText={signatureText}
        />
      </div>

      {/* SIGNATURE MODAL OVERLAY */}
      {isSignatureOpen && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-500 animate-in fade-in">
              <div 
                className="relative bg-[#f8f8f8] p-4 pb-12 shadow-[0_0_50px_rgba(255,255,255,0.2)] transform transition-transform duration-700 scale-100 rotate-[-2deg]"
                style={{ width: 'min(80vw, 320px)', aspectRatio: '3.5/4.2' }}
              >
                  {/* Close Button */}
                  <button 
                    onClick={() => setIsSignatureOpen(false)}
                    className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-black border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors z-50"
                  >
                      ×
                  </button>

                  {/* Photo Area */}
                  <div className="w-full h-[75%] bg-[#1a1a1a] overflow-hidden relative shadow-inner">
                      {activePhotoUrl ? (
                          <img src={activePhotoUrl} alt="Memory" className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40 font-body text-lg italic tracking-widest text-center px-4">
                              我~一直都想对你说~
                          </div>
                      )}
                      {/* Gloss Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 pointer-events-none" />
                  </div>

                  {/* Signature Input Area */}
                  <div className="absolute bottom-0 left-0 w-full h-[25%] flex items-center justify-center px-4">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Sign here..."
                        value={signatureText}
                        onChange={(e) => setSignatureText(e.target.value)}
                        className="w-full text-center bg-transparent border-none outline-none font-script text-3xl md:text-4xl text-[#1a1a1a] placeholder:text-gray-300/50"
                        style={{ transform: 'translateY(-5px) rotate(-1deg)' }}
                        maxLength={20}
                      />
                  </div>
              </div>
              
              {/* Confirm Button (Floating below) */}
              <div className="absolute bottom-10 left-0 w-full flex justify-center">
                  <button 
                    onClick={() => setIsSignatureOpen(false)}
                    className={textButtonClass}
                  >
                      完成签名
                  </button>
              </div>
          </div>
      )}

      {/* TOP RIGHT - CONTROLS */}
      {/* Responsive positioning: Flex Row on Mobile, Flex Col on Desktop */}
      <div className={`absolute top-6 right-6 md:top-10 md:right-10 z-30 pointer-events-auto flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-4 transition-opacity duration-500 ${isSignatureOpen || isProcessing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          
          {/* 1. Camera Toggle */}
          <button 
            onClick={() => setShowCamera(prev => !prev)}
            className={`${iconButtonClass} ${showCamera ? 'text-white border-white/60 bg-white/10' : 'text-slate-300'}`}
            title={showCamera ? "隐藏摄像头" : "显示摄像头"}
          >
              {showCamera ? (
                  // Camera On Icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
              ) : (
                  // Camera Off Icon (Slash)
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m3.75-3.75l3.75-3.75" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  </svg>
              )}
          </button>

          {/* 2. Upload Photos */}
          <button 
            onClick={handleUploadClick}
            className={iconButtonClass}
            title="上传照片"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
          </button>

          {/* 3. Polaroid Signature */}
          <button 
            onClick={handleSignatureClick}
            className={iconButtonClass}
            title="拍立得签名"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
          </button>

          {/* 4. Disperse/Assemble Toggle */}
          <button 
            onClick={toggleState}
            className={iconButtonClass}
            title={targetMix === 1 ? "散开" : "聚拢"}
          >
            {targetMix === 1 ? (
                // Icon: Disperse (Explosion out)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
            ) : (
                // Icon: Assemble (Implosion in)
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
            )}
          </button>
      </div>

      {/* Footer Info (Bottom Left) */}
      <div className={`absolute bottom-6 left-6 z-20 pointer-events-none transition-opacity duration-500 ${isSignatureOpen ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-white/20 text-[10px] uppercase tracking-widest font-luxury">
                <div>一颗美丽的圣诞树</div>
                <div className="text-slate-500">Made by Southpl</div>
            </div>
      </div>

      {/* Logic */}
      <GestureController onGesture={handleGesture} isGuiVisible={showCamera} />
    </div>
  );
};

export default App;
