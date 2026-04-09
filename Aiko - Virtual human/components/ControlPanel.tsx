import React, { useState, useRef, useEffect, memo } from 'react';
import { ConnectionState } from '../types';
import { playToggleOn, playToggleOff, playSend } from '../utils/soundEffects';

interface ControlPanelProps {
  onSendMessage: (text: string) => void;
  onToggleRecord: () => void;
  onToggleCamera: () => void;
  onToggleWakeWord: () => void;
  connectionState: ConnectionState;
  isCameraOn: boolean;
  isWakeWordEnabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = memo(({
  onSendMessage,
  onToggleRecord,
  onToggleCamera,
  onToggleWakeWord,
  connectionState,
  isCameraOn,
  isWakeWordEnabled
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      playSend();
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleToggleWakeWord = () => {
    if (isWakeWordEnabled) playToggleOff(); else playToggleOn();
    onToggleWakeWord();
  };

  const handleToggleCamera = () => {
    if (isCameraOn) playToggleOff(); else playToggleOn();
    onToggleCamera();
  };

  const handleToggleRecord = () => {
    const isListening = connectionState === ConnectionState.LISTENING;
    if (isListening) playToggleOff(); else playToggleOn();
    onToggleRecord();
  };

  const isListening = connectionState === ConnectionState.LISTENING;
  const isProcessing = connectionState === ConnectionState.PROCESSING;
  const isSpeaking = connectionState === ConnectionState.SPEAKING;
  const isDisabled = isProcessing || isSpeaking;

  useEffect(() => {
    if (!isDisabled && !isListening) {
      inputRef.current?.focus();
    }
  }, [isDisabled, isListening]);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe z-50">
      <div className="max-w-2xl mx-auto backdrop-blur-xl bg-aiko-surface/90 rounded-2xl border border-white/10 p-2 shadow-2xl flex items-center gap-2">

        {/* Wake Word */}
        <button
          onClick={handleToggleWakeWord}
          className={`
            w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
            ${isWakeWordEnabled
              ? 'bg-aiko-accent text-aiko-base shadow-[0_0_20px_rgba(122,162,247,0.5)]'
              : 'bg-white/10 hover:bg-white/20 text-white'}
          `}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {isWakeWordEnabled && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aiko-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-aiko-primary"></span>
            </span>
          )}
        </button>

        {/* Camera */}
        <button
          onClick={handleToggleCamera}
          className={`
            w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
            ${isCameraOn
              ? 'bg-aiko-success text-aiko-base shadow-[0_0_20px_rgba(158,206,106,0.5)]'
              : 'bg-white/10 hover:bg-white/20 text-white'}
          `}
        >
          {isCameraOn ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>

        {/* Microphone */}
        <button
          onClick={handleToggleRecord}
          disabled={isDisabled}
          className={`
            w-12 h-12 md:w-14 md:h-14 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300
            ${isListening && !isWakeWordEnabled
              ? 'bg-aiko-danger animate-pulse shadow-[0_0_20px_rgba(247,118,142,0.5)]'
              : 'bg-aiko-primary hover:bg-aiko-accent text-aiko-base'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isWakeWordEnabled && isListening ? 'bg-aiko-success animate-pulse' : ''}
          `}
        >
          {isListening ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isSpeaking ? "Speaking..." :
                isListening ? "Listening..." :
                  "Type..."
            }
            disabled={isDisabled || (isListening && !isWakeWordEnabled)}
            className="w-full bg-black/20 text-white placeholder-white/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-aiko-primary/50 disabled:opacity-50 transition-all text-base"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isDisabled}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 text-white p-3 rounded-xl transition-all"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
});