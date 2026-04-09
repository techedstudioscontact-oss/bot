import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export class WebSearchService {
    /**
     * Search Google and return results
     * Format: [SEARCH: query]
     */
    static async searchGoogle(query: string): Promise<{ success: boolean; message: string }> {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        try {
            await Browser.open({ url: searchUrl });
            return {
                success: true,
                message: `Searching Google for: ${query}`
            };
        } catch (error) {
            console.error('Google search error:', error);
            return {
                success: false,
                message: `Failed to search: ${error}`
            };
        }
    }

    /**
     * Parse search action from AI response
     * Format: [SEARCH: query text]
     */
    static parseSearch(text: string): string | null {
        const searchRegex = /\[SEARCH:\s*([^\]]+)\]/i;
        const match = text.match(searchRegex);

        if (!match) return null;

        return match[1].trim();
    }
}
