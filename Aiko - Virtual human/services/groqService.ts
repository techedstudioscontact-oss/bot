import Groq from "groq-sdk";
import { AIKO_SYSTEM_PROMPT } from '../constants';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true
});

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;
}

export interface RelationshipContext {
    level: number;
    userName: string;
    mood: string;
    memories?: string[];
}

export const sendMessageToGroq = async (
    history: ChatMessage[],
    imageBase64?: string,
    relationshipContext?: RelationshipContext
) => {
    try {
        // Build dynamic system prompt with relationship context
        const systemPrompt = relationshipContext
            ? AIKO_SYSTEM_PROMPT(
                relationshipContext.level,
                relationshipContext.userName,
                relationshipContext.mood,
                relationshipContext.memories
            )
            : AIKO_SYSTEM_PROMPT(0, 'Sir', 'normal', []);

        // Prepare messages for vision API
        const messages = [
            { role: "system" as const, content: systemPrompt },
            ...history.slice(0, -1) // All previous messages
        ];

        // Handle the last user message with optional image
        const lastMessage = history[history.length - 1];
        if (imageBase64 && lastMessage.role === "user") {
            messages.push({
                role: "user" as const,
                content: [
                    { type: "text" as const, text: typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content[0]?.text || "" },
                    {
                        type: "image_url" as const,
                        image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
                    }
                ]
            });
        } else {
            messages.push(lastMessage as any);
        }

        const completion = await groq.chat.completions.create({
            messages: messages as any,
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_tokens: 200,
        });

        return completion.choices[0]?.message?.content || "Arre Sir, kuch samajh nahi aaya. Phir se boliye na?";
    } catch (error) {
        console.error("Groq Vision API Error:", error);
        return "Sorry Sir, camera toh chal raha hai par main dekh nahi pa raha. Koi technical problem hai. [EMOTION: sad]";
    }
};
