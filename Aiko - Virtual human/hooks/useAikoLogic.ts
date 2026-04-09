import { useState, useCallback, useRef, useEffect } from 'react';
import { Emotion, ConnectionState, ChatMessage } from '../types';
import { sendMessageToGroq } from '../services/groqService';
import { DeviceControlService } from '../services/deviceControl';
import { WebSearchService } from '../services/webSearchService';
import { AikoMemory } from '../services/aikoMemory';
import { App } from '@capacitor/app';
import { NotificationService } from '../services/notificationService';

// Helper to extract emotion from Groq response
const extractEmotion = (text: string): { cleanText: string; emotion: Emotion } => {
  const emotionRegex = /\[EMOTION:\s*(\w+)\]/i;
  const match = text.match(emotionRegex);
  let emotion = Emotion.NEUTRAL;
  let cleanText = text;

  if (match) {
    const captured = match[1].toLowerCase();
    cleanText = text.replace(match[0], '').trim();

    switch (captured) {
      case 'happy': emotion = Emotion.HAPPY; break;
      case 'sad': emotion = Emotion.SAD; break;
      case 'angry': emotion = Emotion.ANGRY; break;
      case 'surprised': emotion = Emotion.SURPRISED; break;
      case 'shy': emotion = Emotion.SHY; break;
      case 'curious': emotion = Emotion.CURIOUS; break;
      case 'excited': emotion = Emotion.EXCITED; break;
      case 'embarrassed': emotion = Emotion.EMBARRASSED; break;
      case 'crying': emotion = Emotion.CRYING; break;
      default: emotion = Emotion.NEUTRAL;
    }
  }
  return { cleanText, emotion };
};

export const useAikoLogic = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTED);
  const [currentAction, setCurrentAction] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);

  // Proactive Notifications Hook
  useEffect(() => {
    // 1. Initial Setup & Permissions
    const setupNotifications = async () => {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        // Schedule Greetings (Morning 8am, Night 10pm)
        const now = new Date();

        const morning = new Date();
        morning.setHours(8, 0, 0, 0);
        if (morning <= now) morning.setDate(morning.getDate() + 1);

        const night = new Date();
        night.setHours(22, 0, 0, 0);
        if (night <= now) night.setDate(night.getDate() + 1);

        NotificationService.scheduleDailyGreeting('morning', morning);
        NotificationService.scheduleDailyGreeting('night', night);
      }
    };

    setupNotifications();

    // 2. Handle App Background/Foreground for "Missing You"
    const listenerPromise = App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) {
        // App went to background -> Schedule "Missing You" check
        console.log("App backgrounded: Scheduling proactive check...");
        const rel = AikoMemory.getRelationship();
        if (rel.level >= 5) {
          NotificationService.scheduleMissingYouNotification(new Date());
        }
      } else {
        // App resumed -> User is here! Cancel the "Missing You" alert
        console.log("App resumed: Canceling proactive check...");
        NotificationService.cancelMissingYou();
      }
    });

    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, []);
  const [relationshipLevel, setRelationshipLevel] = useState<number>(0);
  const [userName, setUserName] = useState<string>('Sir');

  const isProcessingRef = useRef(false);

  // Initialize memory system on mount
  useEffect(() => {
    // Initialize Daily Mood (Checks if new day)
    AikoMemory.initializeDailyMood();

    // Check if first time user
    if (AikoMemory.isFirstTime()) {
      setIsFirstTime(true);
    } else {
      // Load existing profile
      const profile = AikoMemory.getUserProfile();
      if (profile) {
        setUserName(profile.customNickname || profile.name || 'Sir');
      }
      const rel = AikoMemory.getRelationship();
      setRelationshipLevel(rel.level);

      // LOAD PREVIOUS CONVERSATIONS
      const savedConversations = AikoMemory.getConversations();
      if (savedConversations.length > 0) {
        // Get the most recent conversation
        const lastConversation = savedConversations[savedConversations.length - 1];

        // Convert to ChatMessage format and restore
        const restoredMessages: ChatMessage[] = lastConversation.messages.map(msg => ({
          id: Date.now().toString() + Math.random(),
          role: msg.role,
          text: msg.text,
          timestamp: msg.timestamp || Date.now()
        }));

        setMessages(restoredMessages);
        console.log(`💬 Loaded ${restoredMessages.length} previous messages!`);
      }
    }
  }, []);

  // extractEmotion moved to module scope

  const processMessage = useCallback(async (text: string, image?: string, speakFn?: (text: string, emotion: Emotion) => void) => {
    if (!text.trim() && !image) return;
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setConnectionState(ConnectionState.PROCESSING); // Visual state for "Processing/Thinking"

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // FIRST TIME USER: Ask for name
      if (isFirstTime) {
        // Check if this looks like a name response
        const looksLikeName = text.length > 2 && text.length < 30 &&
          !text.toLowerCase().includes('nothing') &&
          !text.toLowerCase().includes('ntg') &&
          !text.toLowerCase().includes('kuch nahi') &&
          !text.toLowerCase().includes('oh') &&
          !text.toLowerCase().includes('hmm');

        // Check if user is providing their name - Stricter check
        if (looksLikeName && (text.match(/^[A-Za-z\s]+$/) || text.trim().split(' ').length <= 3)) {
          // Extract potential name (simple heuristic - first capitalized word or whole text if short)
          const potentialName = text.trim();

          if (potentialName) {
            // Save profile
            AikoMemory.createUserProfile(potentialName);
            setUserName(potentialName);
            setIsFirstTime(false);
            setRelationshipLevel(1);

            // Welcome response
            const welcomeMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              text: `${potentialName}! Kya khoobsurat naam hai! Main bohot khush hoon aapse milkar! 😊 Main Aiko hoon, aur ab se hum dost hain! [EMOTION: excited]`,
              timestamp: Date.now() + 1
            };

            setMessages(prev => [...prev, welcomeMsg]);
            setCurrentEmotion(Emotion.EXCITED);

            if (speakFn) {
              speakFn(welcomeMsg.text.replace(/\[EMOTION:.*?\]/g, '').trim(), Emotion.EXCITED);
            }

            isProcessingRef.current = false;
            setConnectionState(ConnectionState.CONNECTED);
            return;
          }
        }

        // First interaction - ask name
        const askNameMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: 'Namaste! Main Aiko hoon, aapki virtual companion! 💜 Aapse milkar bohot khushi hui! Aapka naam kya hai? [EMOTION: happy]',
          timestamp: Date.now() + 1
        };

        setMessages(prev => [...prev, askNameMsg]);
        setCurrentEmotion(Emotion.HAPPY);

        if (speakFn) {
          speakFn(askNameMsg.text.replace(/\[EMOTION:.*?\]/g, '').trim(), Emotion.HAPPY);
        }

        isProcessingRef.current = false;
        setConnectionState(ConnectionState.CONNECTED);
        return;
      }

      // Track conversation
      AikoMemory.incrementConversation();
      const rel = AikoMemory.getRelationship();
      setRelationshipLevel(rel.level);

      // 2. Prepare History for Groq
      const history = messages.map(m => ({
        role: (m.role === 'model' ? 'assistant' : m.role) as 'user' | 'assistant' | 'system',
        content: m.text
      }));
      history.push({ role: 'user', content: text });

      // 3. Call Groq with relationship context!
      const relationshipContext = {
        level: relationshipLevel,
        userName: userName,
        mood: AikoMemory.getMood().current,
        memories: rel.emotionalMoments?.map((m: { date: string; what: string; emotion: string }) => `${m.date.split('T')[0]}: ${m.what} (${m.emotion})`) || []
      };

      const responseText = await sendMessageToGroq(history, image, relationshipContext);

      // 4. Parse Emotion
      const { cleanText: textAfterEmotion, emotion } = extractEmotion(responseText);

      // 5. Parse Device Action & Memory
      const action = DeviceControlService.parseAction(responseText);
      let cleanText = textAfterEmotion;

      // Parse & Handle Memory
      const memoryRegex = /\[MEMORY:\s*([^|]+)\|\s*([^\]]+)\]/i;
      const memMatch = cleanText.match(memoryRegex);
      if (memMatch) {
        const [fullTag, memEmotion, memWhat] = memMatch;
        console.log(`🧠 Saving Memory: ${memWhat.trim()} (${memEmotion.trim()})`);
        AikoMemory.addEmotionalMoment(memEmotion.trim(), memWhat.trim());
        cleanText = cleanText.replace(fullTag, '');
      }

      // Remove action tag from display text if present
      if (action) {
        cleanText = cleanText.replace(/\[ACTION:[^\]]+\]/gi, '');
      }

      cleanText = cleanText.trim();

      // 6. Add AI Message
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: cleanText,
        timestamp: Date.now(),
        emotion: emotion
      };

      setMessages(prev => [...prev, aiMsg]);
      setCurrentEmotion(emotion);

      // 7. Execute device action (if any)
      if (action) {
        try {
          const result = await DeviceControlService.executeAction(action);
          setCurrentAction({ message: result.message, type: result.success ? 'success' : 'error' });
          setTimeout(() => setCurrentAction(null), 3000); // Clear after 3s
        } catch (err) {
          console.error('Action execution error:', err);
          setCurrentAction({ message: 'Failed to execute action', type: 'error' });
          setTimeout(() => setCurrentAction(null), 3000);
        }
      }

      // 8. Check for web search
      const searchQuery = WebSearchService.parseSearch(responseText);
      if (searchQuery) {
        try {
          const result = await WebSearchService.searchGoogle(searchQuery);
          setCurrentAction({ message: result.message, type: result.success ? 'success' : 'error' });
          setTimeout(() => setCurrentAction(null), 3000);
        } catch (err) {
          console.error('Search error:', err);
        }
      }

      // 9. Speak
      if (speakFn) {
        setConnectionState(ConnectionState.SPEAKING);
        speakFn(cleanText, emotion);
      }

      // 10. SAVE CONVERSATION TO MEMORY
      const conversationMessages = [...messages, userMsg, aiMsg].map(m => ({
        role: m.role as 'user' | 'assistant',
        text: m.text,
        emotion: undefined,
        timestamp: m.timestamp
      }));
      AikoMemory.saveConversation(conversationMessages);
      console.log('💾 Conversation saved to memory!');

      isProcessingRef.current = false;
      setConnectionState(ConnectionState.CONNECTED);
    } catch (error) {
      console.error("Logic Error:", error);
      setConnectionState(ConnectionState.DISCONNECTED); // Or ERROR if available, but disconnected is close
      isProcessingRef.current = false;
    }
  }, [messages, isFirstTime, relationshipLevel, userName]);

  const handleSpeechEnd = useCallback(() => {
    setConnectionState(ConnectionState.CONNECTED); // Back to idle
    isProcessingRef.current = false;
  }, []);

  const handleListeningStart = useCallback(() => {
    setConnectionState(ConnectionState.LISTENING);
  }, []);



  const triggerGreeting = useCallback((speakFn: (text: string, emotion: Emotion) => void) => {
    // Check directly against memory for instant feedback on mount, or state
    if (AikoMemory.isFirstTime() && messages.length === 0) {
      const text = 'Namaste! Main Aiko hoon, aapki virtual companion! 💜 Aapse milkar bohot khushi hui! Aapka naam kya hai? [EMOTION: happy]';

      const askNameMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        text: text,
        timestamp: Date.now()
      };

      setMessages([askNameMsg]);
      setCurrentEmotion(Emotion.HAPPY);
      // Ensure state is synced
      setIsFirstTime(true);

      speakFn(text.replace(/\[EMOTION:.*?\]/g, '').trim(), Emotion.HAPPY);
    }
  }, [messages]);

  return {
    messages,
    currentEmotion,
    connectionState,
    currentAction,
    processMessage,
    handleSpeechEnd,
    handleListeningStart,
    setConnectionState,
    triggerGreeting
  };
};