import { useState, useRef, useEffect, useCallback } from 'react';
import { Emotion } from '../types';
import { VOICE_CONFIG } from '../constants';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

interface UseVoiceProps {
  onSpeechResult: (text: string) => void;
  onSpeechEnd: () => void;
}

// Wake words - expanded list for robustness
const WAKE_WORDS = [
  'hey aiko', 'hey shara', 'aiko', 'shara', 'hi aiko', 'hello aiko',
  'hey sara', 'sara', 'sarah', 'hey sarah', 'saira', 'hey saira', 'hi sara',
  'zara', 'hey zara', 'sharah', 'hey sharah',
  'namaste', 'suno', 'hey suno' // Added common Hindi attention grabbers
];

// Detect if running on native mobile platform
const isNativePlatform = Capacitor.isNativePlatform();
const hasWebSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export const useVoice = ({ onSpeechResult, onSpeechEnd }: UseVoiceProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(hasWebSpeech ? window.speechSynthesis : null);
  const wakeWordActiveRef = useRef(false);

  // Load voices immediately and on change (only for web)
  useEffect(() => {
    if (!hasWebSpeech) return;

    const loadVoices = () => {
      if (!window.speechSynthesis) return; // Safety check

      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Sync ref with state
  useEffect(() => {
    wakeWordActiveRef.current = wakeWordEnabled;
    if (wakeWordEnabled && !isListening && !isSpeaking) {
      startListeningInternal();
    }
    if (!wakeWordEnabled && isListening && !isSpeaking) {
      recognitionRef.current?.stop();
    }
  }, [wakeWordEnabled]);

  const startListeningInternal = () => {
    if (recognitionRef.current && !isSpeaking) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Ignore if already started
      }
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      // Hindi India for better Hindi understanding
      recognitionRef.current.lang = 'hi-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const lowerTranscript = transcript.toLowerCase().trim();
        console.log("Heard:", lowerTranscript);

        if (wakeWordActiveRef.current) {
          const detectedWakeWord = WAKE_WORDS.find(w => lowerTranscript.includes(w));
          if (detectedWakeWord) {
            console.log("Wake word detected:", detectedWakeWord);
            onSpeechResult(transcript);
          }
        } else {
          onSpeechResult(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setWakeWordEnabled(false);
          alert("Microphone access denied. Please allow microphone permissions.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (wakeWordActiveRef.current && synthesisRef.current && !synthesisRef.current.speaking) {
          setTimeout(() => {
            if (wakeWordActiveRef.current && synthesisRef.current && !synthesisRef.current.speaking) {
              startListeningInternal();
            }
          }, 100);
        }
      };
    }
  }, [onSpeechResult]);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
    onSpeechEnd();

    if (wakeWordActiveRef.current) {
      setTimeout(() => {
        startListeningInternal();
      }, 500);
    }
  }, [onSpeechEnd]);

  // --- CALM HINDI VOICE SELECTION ---
  const getPreferredVoice = useCallback(() => {
    const available = voices.length > 0 ? voices : window.speechSynthesis.getVoices();

    const isFemale = (v: SpeechSynthesisVoice) =>
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('woman') ||
      (!v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('man'));

    let voice: SpeechSynthesisVoice | undefined;

    // 1. Google Hindi (Soft, high quality)
    voice = available.find(v => v.name === 'Google Hindi');
    if (voice) return voice;

    // 2. Microsoft Kalpana (Native Hindi Female)
    voice = available.find(v => v.name.includes('Microsoft Kalpana'));
    if (voice) return voice;

    // 3. Lekha (Mac Hindi)
    voice = available.find(v => v.name.includes('Lekha'));
    if (voice) return voice;

    // 4. Any Hindi Female
    voice = available.find(v => v.lang === 'hi-IN' && isFemale(v));
    if (voice) return voice;

    // 5. Any Hindi
    voice = available.find(v => v.lang === 'hi-IN');
    if (voice) return voice;

    // 6. Fallback to Indian English Female (Microsoft Swara / Google English India)
    voice = available.find(v => v.name.includes('Google English (India)') && isFemale(v));
    if (voice) return voice;

    voice = available.find(v => v.name.includes('Microsoft Swara'));
    if (voice) return voice;

    // 7. General Female fallback
    return available.find(v => isFemale(v)) || available[0];
  }, [voices]);

  const speak = useCallback(async (text: string, emotion: Emotion) => {
    // === NATIVE MOBILE: Use Capacitor TTS ===
    if (isNativePlatform) {
      try {
        setIsSpeaking(true);

        // Stop any ongoing speech
        await TextToSpeech.stop();

        // Get pitch and rate from config
        const pitch = VOICE_CONFIG.pitch[emotion];
        const rate = VOICE_CONFIG.rate[emotion] * 0.95;

        // Speak using native TTS
        await TextToSpeech.speak({
          text: text,
          lang: 'hi-IN', // Hindi India
          rate: rate,
          pitch: pitch,
          volume: (emotion === Emotion.SHY || emotion === Emotion.SAD) ? 0.8 : 1.0,
          category: 'playback'
        });

        setIsSpeaking(false);
        handleSpeechEnd();
      } catch (error) {
        console.error('Capacitor TTS error:', error);
        setIsSpeaking(false);
        handleSpeechEnd();
      }
      return;
    }

    // === WEB BROWSER: Use Web Speech API ===
    if (!hasWebSpeech || !synthesisRef.current) {
      console.warn('Speech synthesis not available');
      handleSpeechEnd();
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
      setIsListening(false);
    }

    synthesisRef.current.cancel();

    // MOBILE FIX: Resume synthesis on mobile browsers
    if (synthesisRef.current.paused) {
      synthesisRef.current.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getPreferredVoice();

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang; // Ensure utterance matches voice lang
    }

    // Adjust rate/pitch for "Calm" feel
    utterance.pitch = VOICE_CONFIG.pitch[emotion];
    utterance.rate = VOICE_CONFIG.rate[emotion] * 0.95; // Slightly slower for clarity

    if (emotion === Emotion.SHY || emotion === Emotion.SAD) {
      utterance.volume = 0.8;
    } else {
      utterance.volume = 1.0;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      // MOBILE FIX: Ensure synthesis isn't paused on mobile
      if (synthesisRef.current && synthesisRef.current.paused) {
        synthesisRef.current.resume();
      }
    };
    utterance.onend = handleSpeechEnd;
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      handleSpeechEnd();
    };

    // MOBILE FIX: Small delay for Android/iOS compatibility
    setTimeout(() => {
      if (synthesisRef.current) {
        synthesisRef.current.speak(utterance);
      }
    }, 50);
  }, [handleSpeechEnd, getPreferredVoice]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isSpeaking) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // already active
      }
    }
  }, [isSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled(prev => !prev);
  }, []);

  return {
    isListening,
    isSpeaking,
    speak,
    startListening,
    stopListening,
    toggleListening,
    wakeWordEnabled,
    toggleWakeWord
  };
};