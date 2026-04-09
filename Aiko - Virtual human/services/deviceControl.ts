import { AppLauncher } from '@capacitor/app-launcher';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { ContactService } from './contactService';

export interface DeviceAction {
    type: string;
    params: string[];
}

// Common app package mappings
const APP_PACKAGES: Record<string, string> = {
    'youtube': 'com.google.android.youtube',
    'whatsapp': 'com.whatsapp',
    'instagram': 'com.instagram.android',
    'facebook': 'com.facebook.katana',
    'twitter': 'com.twitter.android',
    'camera': 'com.android.camera',
    'gallery': 'com.google.android.apps.photos',
    'chrome': 'com.android.chrome',
    'gmail': 'com.google.android.gm',
    'maps': 'com.google.android.apps.maps',
    'spotify': 'com.spotify.music',
    'telegram': 'org.telegram.messenger',
    'android studio': 'com.google.android.studio',
    'settings': 'com.android.settings',
    'clock': 'com.google.android.deskclock',
    'calculator': 'com.google.android.calculator',
};

export class DeviceControlService {
    /**
     * Execute a device control action
     */
    static async executeAction(action: DeviceAction): Promise<{ success: boolean; message: string }> {
        try {
            // Normalize action type (Aliases)
            let type = action.type.toLowerCase();
            if (type === 'open' || type === 'launch' || type === 'start') type = 'open_app';
            if (type === 'browse' || type === 'visit' || type === 'go_to') type = 'url';
            if (type === 'find' || type === 'google' || type === 'search_for') type = 'search';
            if (type === 'msg' || type === 'message' || type === 'text') type = 'sms';
            if (type === 'phone' || type === 'dial' || type === 'call') type = 'call';

            switch (type) {
                case 'open_app':
                    return await this.openApp(action.params[0]);
                case 'url':
                    return await this.openUrl(action.params[0]);
                case 'search':
                    return await this.searchWeb(action.params.join(' '));
                case 'call':
                    return await this.makeCall(action.params[0]);
                case 'sms':
                    return await this.sendSms(action.params[0], action.params.slice(1).join(' '));
                case 'whatsapp':
                    return await this.sendWhatsApp(action.params[0], action.params.slice(1).join(' '));
                default:
                    console.warn(`Unknown action type: ${action.type}`);
                    return { success: false, message: `Unknown action type: ${action.type}` };
            }
        } catch (error) {
            console.error('Device control error:', error);
            return { success: false, message: `Error: ${error}` };
        }
    }

    /**
     * Open an Android app by name or package
     */
    private static async openApp(appName: string): Promise<{ success: boolean; message: string }> {
        const appLower = appName.toLowerCase().trim();
        const packageName = APP_PACKAGES[appLower];

        if (!packageName) {
            // Try to search on Play Store as fallback
            await Browser.open({ url: `market://search?q=${encodeURIComponent(appName)}` });
            return { success: true, message: `Searching for ${appName} on Play Store` };
        }

        if (Capacitor.isNativePlatform()) {
            try {
                const canOpen = await AppLauncher.canOpenUrl({ url: packageName });
                if (canOpen.value) {
                    await AppLauncher.openUrl({ url: packageName });
                    return { success: true, message: `Opened ${appName}` };
                } else {
                    // App not installed, open Play Store
                    await Browser.open({ url: `market://details?id=${packageName}` });
                    return { success: true, message: `${appName} not installed, opening Play Store` };
                }
            } catch {
                await Browser.open({ url: `market://details?id=${packageName}` });
                return { success: true, message: `Opening Play Store for ${appName}` };
            }
        } else {
            // Web fallback - try to open web version
            return await this.openUrl(this.getWebUrlForApp(appLower));
        }
    }

    /**
     * Open a URL in browser
     */
    private static async openUrl(url: string): Promise<{ success: boolean; message: string }> {
        let fullUrl = url;

        // Add https if no protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            fullUrl = `https://${url}`;
        }

        await Browser.open({ url: fullUrl });
        return { success: true, message: `Opened ${url}` };
    }

    /**
     * Search the web
     */
    private static async searchWeb(query: string): Promise<{ success: boolean; message: string }> {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        await Browser.open({ url: searchUrl });
        return { success: true, message: `Searching for: ${query}` };
    }

    /**
     * Open phone dialer or make call
     */
    private static async makeCall(contact?: string): Promise<{ success: boolean; message: string }> {
        let phoneNumber = contact;

        // If contact is provided and not a number, try to find it in contacts
        if (contact && !/^\d+$/.test(contact)) {
            console.log(`Searching for contact: ${contact}`);
            const foundNumber = await ContactService.findContactNumber(contact);
            if (foundNumber) {
                phoneNumber = foundNumber;
            } else {
                // Contact not found, open dialer anyway
                const telUrl = 'tel:';
                if (Capacitor.isNativePlatform()) {
                    await AppLauncher.openUrl({ url: telUrl });
                } else {
                    window.open(telUrl, '_self');
                }
                return { success: false, message: `Contact "${contact}" not found. Opening dialer.` };
            }
        }

        const telUrl = phoneNumber ? `tel:${phoneNumber}` : 'tel:';

        if (Capacitor.isNativePlatform()) {
            await AppLauncher.openUrl({ url: telUrl });
            return { success: true, message: phoneNumber ? `Calling ${contact || phoneNumber}` : 'Opening dialer' };
        } else {
            window.open(telUrl, '_self');
            return { success: true, message: 'Opening dialer' };
        }
    }

    /**
     * Open SMS app
     */
    private static async sendSms(number?: string, message?: string): Promise<{ success: boolean; message: string }> {
        let smsUrl = 'sms:';

        if (number) {
            smsUrl += number;
        }

        if (message) {
            smsUrl += `?body=${encodeURIComponent(message)}`;
        }

        if (Capacitor.isNativePlatform()) {
            await AppLauncher.openUrl({ url: smsUrl });
            return { success: true, message: number ? `Texting ${number}` : 'Opening messages' };
        } else {
            window.open(smsUrl, '_self');
            return { success: true, message: 'Opening messages' };
        }
    }

    /**
     * Send WhatsApp message
     */
    private static async sendWhatsApp(contact?: string, message?: string): Promise<{ success: boolean; message: string }> {
        let phoneNumber = contact;

        // If contact is provided and not a number, try to find it in contacts
        if (contact && !/^\d+$/.test(contact)) {
            console.log(`Searching for WhatsApp contact: ${contact}`);
            const foundNumber = await ContactService.findContactNumber(contact);
            if (foundNumber) {
                phoneNumber = foundNumber;
            } else {
                // Contact not found, just open WhatsApp with message
                let whatsappUrl = 'whatsapp://send';
                if (message) {
                    whatsappUrl += `?text=${encodeURIComponent(message)}`;
                }

                if (Capacitor.isNativePlatform()) {
                    await AppLauncher.openUrl({ url: whatsappUrl });
                } else {
                    window.open(whatsappUrl, '_blank');
                }
                return { success: false, message: `Contact "${contact}" not found. Select contact manually in WhatsApp.` };
            }
        }

        // WhatsApp URL scheme: whatsapp://send?phone=PHONE&text=MESSAGE
        let whatsappUrl = 'whatsapp://send';
        const params = [];

        if (phoneNumber) {
            // Remove all non-digits for WhatsApp
            const cleanNumber = phoneNumber.replace(/\D/g, '');
            params.push(`phone=${cleanNumber}`);
        }

        if (message) {
            params.push(`text=${encodeURIComponent(message)}`);
        }

        if (params.length > 0) {
            whatsappUrl += '?' + params.join('&');
        }

        if (Capacitor.isNativePlatform()) {
            try {
                await AppLauncher.openUrl({ url: whatsappUrl });
                return { success: true, message: contact ? `Opening WhatsApp for ${contact}` : 'Opening WhatsApp with message' };
            } catch (error) {
                // Fallback: just open WhatsApp app
                const canOpen = await AppLauncher.canOpenUrl({ url: 'com.whatsapp' });
                if (canOpen.value) {
                    await AppLauncher.openUrl({ url: 'com.whatsapp' });
                    return { success: true, message: 'Opened WhatsApp (message not sent)' };
                }
                return { success: false, message: 'WhatsApp not installed' };
            }
        } else {
            window.open(whatsappUrl, '_blank');
            return { success: true, message: 'Opening WhatsApp' };
        }
    }

    /**
     * Get web URL fallback for common apps
     */
    private static getWebUrlForApp(appName: string): string {
        const webUrls: Record<string, string> = {
            'youtube': 'https://youtube.com',
            'whatsapp': 'https://web.whatsapp.com',
            'instagram': 'https://instagram.com',
            'facebook': 'https://facebook.com',
            'twitter': 'https://twitter.com',
            'gmail': 'https://mail.google.com',
            'maps': 'https://maps.google.com',
            'spotify': 'https://open.spotify.com',
        };

        return webUrls[appName] || `https://www.google.com/search?q=${appName}`;
    }

    /**
     * Parse action from AI response
     * Format: [ACTION: type | param1 | param2 | ...]
     */
    static parseAction(text: string): DeviceAction | null {
        const actionRegex = /\[ACTION:\s*(\w+)\s*(?:\|\s*([^\]]+))?\]/i;
        const match = text.match(actionRegex);

        if (!match) return null;

        const type = match[1].toLowerCase();
        const paramsStr = match[2] || '';
        const params = paramsStr.split('|').map(p => p.trim()).filter(Boolean);

        return { type, params };
    }
}
