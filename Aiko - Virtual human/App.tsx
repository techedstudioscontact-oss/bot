import React, { useRef, useEffect } from 'react';
import { CharacterDisplay } from './components/CharacterDisplay';
import { ControlPanel } from './components/ControlPanel';
import { HistoryOverlay } from './components/HistoryOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ActionFeedback } from './components/ActionFeedback';
import { useVoice } from './hooks/useVoice';
import { useVideo } from './hooks/useVideo';
import { useAikoLogic } from './hooks/useAikoLogic';
import { Capacitor } from '@capacitor/core';
import { KeepAwake } from '@capacitor-community/keep-awake';

export default function App() {
  const {
    messages,
    currentEmotion,
    connectionState,
    currentAction,
    processMessage,
    handleSpeechEnd,
    handleListeningStart,
    setConnectionState,
    triggerGreeting
  } = useAikoLogic();

  const { isVideoEnabled, toggleVideo, videoRef, captureFrame } = useVideo();

  // Use a ref to track the latest 'speak' function to avoid circular dependencies in hooks
  const speakRef = useRef<any>(null);

  const {
    isListening,
    isSpeaking,
    speak,
    toggleListening,
    wakeWordEnabled,
    toggleWakeWord
  } = useVoice({
    onSpeechResult: (text: string) => {
      // Use the ref to ensure we have the latest speak function
      const speakFn = speakRef.current || speak;
      processMessage(text, isVideoEnabled ? captureFrame() : undefined, speakFn);
    },
    onSpeechEnd: handleSpeechEnd
  });

  // Keep ref updated
  // KEEP AWAKE: Prevent app from sleeping when wake word is active
  useEffect(() => {
    const manageKeepAwake = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        if (wakeWordEnabled) {
          await KeepAwake.keepAwake();
          console.log('Keep awake enabled - Hey Aiko will work in background');
        } else {
          await KeepAwake.allowSleep();
          console.log('Keep awake disabled');
        }
      } catch (error) {
        console.error('Keep awake error:', error);
      }
    };

    manageKeepAwake();
  }, [wakeWordEnabled]);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  // AUTO-GREETING: Trigger welcome message on first launch
  useEffect(() => {
    if (speak) {
      triggerGreeting(speak);
    }
  }, [speak, triggerGreeting]);

  // PERMISSION REQUESTS: Request all permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');

        // Auto-enable wake word after getting permission
        setTimeout(() => {
          if (!wakeWordEnabled) {
            toggleWakeWord();
            console.log('Wake word auto-enabled');
          }
        }, 1000);
      } catch (error) {
        console.error('Permission request failed:', error);
        alert('Microphone permission is required for "Hey Aiko" to work. Please enable it in Settings.');
      }
    };

    requestPermissions();
  }, []); // Run once on mount

  // MOBILE FIX: Initialize speech synthesis on first user interaction
  useEffect(() => {
    const initializeSpeech = () => {
      // Unlock speech synthesis for mobile browsers
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0; // Silent initialization
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.cancel();

      console.log('Speech synthesis initialized for mobile');

      // Remove listeners after first interaction
      document.removeEventListener('touchstart', initializeSpeech);
      document.removeEventListener('click', initializeSpeech);
    };

    // Add listeners for first user interaction
    document.addEventListener('touchstart', initializeSpeech, { once: true });
    document.addEventListener('click', initializeSpeech, { once: true });

    return () => {
      document.removeEventListener('touchstart', initializeSpeech);
      document.removeEventListener('click', initializeSpeech);
    };
  }, []);

  // Sync Voice Hook state with Brain Logic state
  useEffect(() => {
    if (isListening) {
      handleListeningStart();
    }
  }, [isListening, handleListeningStart]);

  return (
    <ErrorBoundary>
      <div className="w-full h-[100dvh] relative overflow-hidden bg-aiko-base font-sans selection:bg-aiko-primary selection:text-white touch-manipulation" style={{ touchAction: 'none' }}>

        {/* 1. Visual Layer */}
        <CharacterDisplay
          emotion={currentEmotion}
          connectionState={connectionState}
        />

        {/* Hidden Video Element for Capture */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute bottom-28 right-4 w-24 h-36 object-cover rounded-xl border-2 border-white/20 shadow-xl transition-all duration-500 z-40 ${isVideoEnabled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        />

        {/* 2. UI Layer (Chat History) */}
        <HistoryOverlay messages={messages} />

        {/* 3. Controls Layer */}
        <ControlPanel
          onSendMessage={(text) => processMessage(text, isVideoEnabled ? captureFrame() : undefined, speak)}
          onToggleRecord={toggleListening}
          onToggleCamera={toggleVideo}
          onToggleWakeWord={toggleWakeWord}
          isCameraOn={isVideoEnabled}
          connectionState={connectionState}
          isWakeWordEnabled={wakeWordEnabled}
        />

        {/* Action Feedback Toast */}
        {currentAction && (
          <ActionFeedback
            message={currentAction.message}
            type={currentAction.type}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}