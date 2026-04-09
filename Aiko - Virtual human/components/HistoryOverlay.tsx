import React, { memo } from 'react';
import { ChatMessage, Emotion } from '../types';

interface HistoryOverlayProps {
  messages: ChatMessage[];
}

export const HistoryOverlay: React.FC<HistoryOverlayProps> = memo(({ messages }) => {
  if (messages.length === 0) return null;

  const visibleMessages = messages.slice(-3);

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-20 flex flex-col gap-2 mask-linear-fade">
      {visibleMessages.map((msg) => (
        <div 
          key={msg.id} 
          className={`max-w-[80%] md:max-w-[60%] p-4 rounded-2xl backdrop-blur-sm border border-white/5 shadow-lg transition-all animate-float
            ${msg.role === 'user' 
                ? 'self-end bg-black/40 text-right text-gray-200' 
                : 'self-start bg-aiko-surface/60 text-left text-aiko-primary'
            }
          `}
        >
          <p className="text-lg font-medium font-display leading-relaxed">
            {msg.text}
          </p>
          {msg.emotion && msg.emotion !== Emotion.NEUTRAL && (
            <span className="text-xs uppercase tracking-widest opacity-50 mt-1 block">
              {msg.emotion}
            </span>
          )}
        </div>
      ))}
    </div>
  );
});