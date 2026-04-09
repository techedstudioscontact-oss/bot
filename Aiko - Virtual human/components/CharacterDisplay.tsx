import React, { useEffect, useState, memo } from 'react';
import { Emotion, ConnectionState } from '../types';
import { EMOTION_COLORS } from '../constants';

interface CharacterDisplayProps {
  emotion: Emotion;
  connectionState: ConnectionState;
}

export const CharacterDisplay: React.FC<CharacterDisplayProps> = memo(({ emotion, connectionState }) => {
  const [visualClass, setVisualClass] = useState(EMOTION_COLORS[Emotion.NEUTRAL]);

  useEffect(() => {
    setVisualClass(EMOTION_COLORS[emotion]);
  }, [emotion]);

  const isTalking = connectionState === ConnectionState.SPEAKING;
  const isListening = connectionState === ConnectionState.LISTENING;

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-1000 bg-gradient-to-b ${visualClass}`}>
      
      {/* Ambient Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-aiko-primary blur-[100px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-aiko-accent blur-[120px] rounded-full animate-pulse-slow delay-75"></div>
      </div>

      {/* Main Character Placeholder */}
      <div className="relative z-10 flex flex-col items-center mt-[-10vh]">
        <div className={`
          relative w-[80vw] h-[80vw] max-w-[320px] max-h-[320px] rounded-full 
          bg-cover bg-center bg-no-repeat shadow-2xl transition-all duration-500
          border-4 border-opacity-20 border-white
          ${isTalking ? 'animate-breathing scale-105' : 'animate-float'}
          ${isListening ? 'shadow-aiko-success/50' : 'shadow-aiko-primary/30'}
        `}
        style={{
             backgroundImage: 'url("https://img.freepik.com/premium-photo/anime-girl-with-brown-hair-school-uniform_950669-25.jpg")',
             backgroundSize: 'cover',
             boxShadow: isTalking 
                ? '0 0 50px 10px rgba(187, 154, 247, 0.6)' 
                : '0 0 30px 5px rgba(0, 0, 0, 0.5)'
        }}>
           <div className={`absolute inset-0 rounded-full mix-blend-overlay opacity-30 transition-colors duration-500 ${emotion === Emotion.ANGRY ? 'bg-red-600' : emotion === Emotion.HAPPY ? 'bg-yellow-300' : 'bg-transparent'}`}></div>
        </div>

        {/* Status Text */}
        <div className="mt-8 h-8 text-center">
             <span className={`text-sm tracking-widest uppercase font-display font-bold transition-all duration-300
                ${connectionState === ConnectionState.PROCESSING ? 'opacity-100 animate-pulse text-aiko-accent' : 
                  connectionState === ConnectionState.LISTENING ? 'opacity-100 text-aiko-success' : 
                  'opacity-0'}
             `}>
               {connectionState === ConnectionState.PROCESSING ? 'THINKING...' : 
                connectionState === ConnectionState.LISTENING ? 'LISTENING...' : ''}
             </span>
        </div>
      </div>

      {/* Mouth/Speaking Visualization */}
      <div className={`absolute bottom-32 md:bottom-24 flex gap-1 h-8 items-center transition-opacity duration-300 ${isTalking ? 'opacity-100' : 'opacity-0'}`}>
         {[...Array(5)].map((_, i) => (
           <div key={i} className="w-1.5 bg-white rounded-full animate-pulse" style={{
             height: `${Math.random() * 20 + 10}px`,
             animationDuration: `${Math.random() * 0.5 + 0.2}s`
           }}></div>
         ))}
      </div>
    </div>
  );
});