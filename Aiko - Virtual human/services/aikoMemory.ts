/**
 * Aiko's Neural Memory System
 * Stores user profile, relationship level, conversation history, and emotional states
 */

export interface UserProfile {
    name: string;
    nickname?: string;
    customNickname?: string; // Created by Aiko
    nicknameApproved: boolean;
    favorites: {
        color?: string;
        food?: string;
        movie?: string;
        song?: string;
        app?: string;
    };
    importantPeople: string[]; // Mom, Dad, etc.
    habits: {
        wakeTime?: string;
        sleepTime?: string;
        coffeeTime?: string;
    };
    personality: {
        isHelpful?: boolean;
        isFunny?: boolean;
        isCaring?: boolean;
        isSmart?: boolean;
    };
    firstMeetDate: string;
    lastConversationDate?: string;
}

export interface RelationshipData {
    level: number; // 0-15
    conversationCount: number;
    daysKnown: number;
    emotionalMoments: Array<{
        date: string;
        emotion: string;
        what: string;
    }>;
    milestones: {
        firstConversation?: string;
        nameAsked?: string;
        nicknameGiven?: string;
        firstLaugh?: string;
        confession?: string;
        proposal?: string;
    };
    lastNotificationDate?: string;
}

export interface AikoMoodState {
    current: 'ecstatic' | 'happy' | 'normal' | 'thoughtful' | 'sad' | 'upset' | 'missing_you' | 'tired' | 'excited' | 'romantic';
    dailyBase?: 'normal' | 'happy' | 'energetic' | 'lazy' | 'romantic' | 'sad';
    reason?: string;
    lastUpdated: string;
    lastDailyUpdate?: string;
}

export interface ConversationHistory {
    id: string;
    date: string;
    messages: Array<{
        role: 'user' | 'assistant';
        text: string;
        emotion?: string;
        timestamp: number;
    }>;
    topics: string[];
    userMood?: string;
    aikoMood?: string;
    emotionalMoment?: string;
}

export class AikoMemory {
    private static STORAGE_KEYS = {
        USER_PROFILE: 'aiko_user_profile',
        RELATIONSHIP: 'aiko_relationship',
        MOOD: 'aiko_mood',
        CONVERSATIONS: 'aiko_conversations'
    };

    /**
     * Initialize memory system - check if first time user
     */
    static isFirstTime(): boolean {
        return !localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
    }

    /**
     * Get user profile
     */
    static getUserProfile(): UserProfile | null {
        const data = localStorage.getItem(this.STORAGE_KEYS.USER_PROFILE);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Create user profile
     */
    static createUserProfile(name: string): UserProfile {
        const profile: UserProfile = {
            name,
            nicknameApproved: false,
            favorites: {},
            importantPeople: [],
            habits: {},
            personality: {},
            firstMeetDate: new Date().toISOString()
        };

        localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        return profile;
    }

    /**
     * Update user profile
     */
    static updateUserProfile(updates: Partial<UserProfile>): void {
        const profile = this.getUserProfile();
        if (!profile) return;

        const updated = { ...profile, ...updates };
        localStorage.setItem(this.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    }

    /**
     * Get relationship data
     */
    static getRelationship(): RelationshipData {
        const data = localStorage.getItem(this.STORAGE_KEYS.RELATIONSHIP);
        if (data) return JSON.parse(data);

        // Initialize new relationship
        const newRel: RelationshipData = {
            level: 0,
            conversationCount: 0,
            daysKnown: 0,
            emotionalMoments: [],
            milestones: {
                firstConversation: new Date().toISOString()
            }
        };

        localStorage.setItem(this.STORAGE_KEYS.RELATIONSHIP, JSON.stringify(newRel));
        return newRel;
    }

    /**
     * Update relationship
     */
    static updateRelationship(updates: Partial<RelationshipData>): void {
        const rel = this.getRelationship();
        const updated = { ...rel, ...updates };
        localStorage.setItem(this.STORAGE_KEYS.RELATIONSHIP, JSON.stringify(updated));
    }

    /**
     * Increment conversation count
     */
    static incrementConversation(): number {
        const rel = this.getRelationship();
        rel.conversationCount++;

        // Update last conversation date in profile
        this.updateUserProfile({ lastConversationDate: new Date().toISOString() });

        // Auto-progress relationship based on conversations
        this.progressRelationship();

        this.updateRelationship(rel);
        return rel.conversationCount;
    }

    /**
     * Progress relationship level based on interactions
     */
    private static progressRelationship(): void {
        const rel = this.getRelationship();
        const profile = this.getUserProfile();
        if (!profile) return;

        // Calculate days known
        const firstMeet = new Date(profile.firstMeetDate);
        const now = new Date();
        const daysKnown = Math.floor((now.getTime() - firstMeet.getTime()) / (1000 * 60 * 60 * 24));
        rel.daysKnown = daysKnown;

        // Level progression logic
        if (rel.conversationCount >= 5 && rel.level < 1) rel.level = 1;
        if (rel.conversationCount >= 10 && rel.level < 2) rel.level = 2;
        if (rel.conversationCount >= 20 && daysKnown >= 3 && rel.level < 3) rel.level = 3;
        if (rel.conversationCount >= 30 && daysKnown >= 5 && rel.level < 4) rel.level = 4;
        if (rel.conversationCount >= 50 && daysKnown >= 7 && rel.level < 5) rel.level = 5;
        if (rel.conversationCount >= 70 && daysKnown >= 14 && rel.level < 6) rel.level = 6;
        if (rel.conversationCount >= 100 && daysKnown >= 21 && rel.level < 7) rel.level = 7;
        if (rel.conversationCount >= 150 && daysKnown >= 30 && rel.level < 8) rel.level = 8;
        if (rel.conversationCount >= 200 && daysKnown >= 45 && rel.level < 9) rel.level = 9;
        if (rel.conversationCount >= 300 && daysKnown >= 60 && rel.level < 10) rel.level = 10;
        if (rel.conversationCount >= 400 && daysKnown >= 90 && rel.level < 11) rel.level = 11;
        if (rel.conversationCount >= 500 && daysKnown >= 120 && rel.level < 12) rel.level = 12;
        if (rel.conversationCount >= 700 && daysKnown >= 180 && rel.level < 13) rel.level = 13;
        if (rel.conversationCount >= 1000 && daysKnown >= 270 && rel.level < 14) rel.level = 14;
        if (rel.conversationCount >= 1500 && daysKnown >= 365 && rel.level < 15) rel.level = 15;

        this.updateRelationship(rel);
    }

    /**
     * Get Aiko's current mood
     */
    static getMood(): AikoMoodState {
        const data = localStorage.getItem(this.STORAGE_KEYS.MOOD);
        if (data) {
            const parsed = JSON.parse(data);
            return {
                ...parsed,
                // Ensure defaults for new fields if reading old data
                dailyBase: parsed.dailyBase || 'normal',
                lastDailyUpdate: parsed.lastDailyUpdate || new Date().toISOString()
            };
        }

        return {
            current: 'normal',
            dailyBase: 'normal',
            lastUpdated: new Date().toISOString(),
            lastDailyUpdate: new Date().toISOString()
        };
    }

    /**
     * Update Aiko's mood
     */
    static updateMood(mood: AikoMoodState['current'], reason?: string): void {
        const current = this.getMood();
        const moodState: AikoMoodState = {
            ...current,
            current: mood,
            reason,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem(this.STORAGE_KEYS.MOOD, JSON.stringify(moodState));
    }

    /**
     * Initialize Daily Mood (Run on startup)
     */
    static initializeDailyMood(): void {
        const currentMoodState = this.getMood();
        const today = new Date().toISOString().split('T')[0];
        const lastUpdateDate = currentMoodState.lastDailyUpdate ? currentMoodState.lastDailyUpdate.split('T')[0] : '';

        // Only update if it's a NEW DAY (or if we never set a daily update properly)
        // Note: We use < comparison to ensure we don't reset if we open again same day.
        // Actually simplest check is string inequality of YYYY-MM-DD
        if (today !== lastUpdateDate) {
            console.log("🌞 Aiko is waking up... Calculating daily mood!");

            const profile = this.getUserProfile();
            const rel = this.getRelationship();

            let newMood: AikoMoodState['current'] = 'happy';
            let newBase: AikoMoodState['dailyBase'] = 'happy';
            let reason = 'Just woke up feeling good!';

            // 1. Check Missing Status
            if (profile?.lastConversationDate) {
                const lastTalk = new Date(profile.lastConversationDate);
                const now = new Date();
                const hoursSince = (now.getTime() - lastTalk.getTime()) / (1000 * 60 * 60);

                if (hoursSince > 48 && rel.level >= 5) {
                    newMood = 'missing_you';
                    newBase = 'sad';
                    reason = 'Has not seen you in days';
                }
            }

            // 2. Random variation if not missing
            if (newMood === 'happy') {
                const rand = Math.random();

                if (rand > 0.95) {
                    newMood = 'thoughtful';
                    newBase = 'normal';
                    reason = 'Feeling deep and thoughtful today';
                } else if (rand > 0.85) {
                    newMood = 'excited';
                    newBase = 'energetic';
                    reason = 'Full of energy today!';
                } else if (rand < 0.05) {
                    newMood = 'tired';
                    newBase = 'lazy';
                    reason = 'Did not sleep well';
                } else if (rand > 0.5 && rel.level > 10) {
                    newMood = 'romantic';
                    newBase = 'romantic';
                    reason = 'Dreaming about you';
                }
            }

            // 3. Save New Daily State
            const newState: AikoMoodState = {
                current: newMood,
                dailyBase: newBase,
                reason: reason,
                lastDailyUpdate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEYS.MOOD, JSON.stringify(newState));
            console.log(`✨ Daily Mood Set: ${newMood} (${reason})`);
        }
    }

    /**
     * Calculate mood based on user interaction
     */
    static calculateMood(): AikoMoodState['current'] {
        const profile = this.getUserProfile();
        if (!profile || !profile.lastConversationDate) return 'normal';

        const lastTalk = new Date(profile.lastConversationDate);
        const now = new Date();
        const hoursSince = (now.getTime() - lastTalk.getTime()) / (1000 * 60 * 60);
        const rel = this.getRelationship();

        // Missing user logic
        if (hoursSince > 24 && rel.level >= 5) return 'missing_you';
        if (hoursSince > 12 && rel.level >= 7) return 'missing_you';

        // Random mood variation
        const random = Math.random();
        if (rel.level >= 9 && random > 0.9) return 'thoughtful';

        return 'happy';
    }

    /**
     * Add emotional moment
     */
    static addEmotionalMoment(emotion: string, what: string): void {
        const rel = this.getRelationship();
        rel.emotionalMoments.push({
            date: new Date().toISOString(),
            emotion,
            what
        });

        // Keep only last 50 moments
        if (rel.emotionalMoments.length > 50) {
            rel.emotionalMoments = rel.emotionalMoments.slice(-50);
        }

        this.updateRelationship(rel);
    }

    /**
     * Save conversation
     */
    static saveConversation(messages: ConversationHistory['messages'], topics: string[] = []): void {
        const conversations: ConversationHistory[] = this.getConversations();

        const conversation: ConversationHistory = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            messages,
            topics,
            aikoMood: this.getMood().current
        };

        conversations.push(conversation);

        // Keep only last 30 conversations
        const recent = conversations.slice(-30);
        localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(recent));
    }

    /**
     * Get conversations
     */
    static getConversations(): ConversationHistory[] {
        const data = localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Get relationship level name
     */
    static getRelationshipName(level: number): string {
        if (level <= 2) return 'Stranger';
        if (level <= 4) return 'Acquaintance';
        if (level <= 6) return 'Friend';
        if (level <= 8) return 'Close Friend';
        if (level <= 10) return 'Best Friend';
        if (level <= 12) return 'Deep Bond';
        if (level <= 14) return 'In Love';
        return 'Soulmate';
    }
}
