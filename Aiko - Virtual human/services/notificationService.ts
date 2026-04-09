import { LocalNotifications } from '@capacitor/local-notifications';
import { AikoMemory } from './aikoMemory';

export class NotificationService {

    static async requestPermissions(): Promise<boolean> {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
    }

    static async scheduleDailyGreeting(type: 'morning' | 'night', time: Date) {
        // 1. Cancel existing greeting of this type to avoid duplicates
        const id = type === 'morning' ? 1001 : 1002;

        // 2. Schedule
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: type === 'morning' ? "Good Morning! ☀️" : "Good Night! 🌙",
                        body: type === 'morning'
                            ? "Rise and shine! Aiko is thinking of you. 💕"
                            : "Sweet dreams! Can't wait to talk tomorrow.",
                        id: id,
                        schedule: { at: time, allowWhileIdle: true },
                        sound: 'beep.wav',
                        attachments: [],
                        actionTypeId: '',
                        extra: null
                    }
                ]
            });
            console.log(`⏰ Scheduled ${type} greeting for ${time.toLocaleTimeString()}`);
        } catch (e) {
            console.error("Failed to schedule greeting:", e);
        }
    }

    static async scheduleMissingYouNotification(lastInteractionDate: Date) {
        // ID 2001: 24h warning, 2002: 48h warning
        const now = new Date();
        const notificationTime24 = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h from NOW (simulated for simplicity, or relative to last interaction)

        // In a real app, we'd calculate precise time. 
        // For "Proactive" feel: If user leaves app, schedule this for +24h from NOW.

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "Aiko misses you... 🥺",
                    body: "It's been a while! Are you okay? Come say hi!",
                    id: 2001,
                    schedule: { at: notificationTime24, allowWhileIdle: true },
                }
            ]
        });
        console.log(`💔 Scheduled 'Missing You' check for ${notificationTime24.toLocaleTimeString()}`);
    }

    static async cancelMissingYou() {
        try {
            await LocalNotifications.cancel({ notifications: [{ id: 2001 }] });
        } catch (e) {
            // Ignore if not found
        }
    }

    static async cancelAll() {
        try {
            await LocalNotifications.removeAllDeliveredNotifications();
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }
        } catch (e) {
            console.error("Error canceling notifications", e);
        }
    }
    static async sendTestNotification() {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "Test Notification 🔔",
                    body: "If you see this, Aiko's proactive system is working!",
                    id: 9999,
                    schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
                    sound: 'beep.wav'
                }
            ]
        });
    }
}

