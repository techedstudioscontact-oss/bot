import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

export class ContactService {
    /**
     * Request contacts permission
     */
    static async requestPermission(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) {
            return false;
        }

        try {
            const result = await Contacts.requestPermissions();
            return result.contacts === 'granted';
        } catch (error) {
            console.error('Failed to request contacts permission:', error);
            return false;
        }
    }

    /**
     * Search for a contact by name and return phone number
     * Flexible matching: "maa", "mom", "mother" will all match
     */
    static async findContactNumber(name: string): Promise<string | null> {
        if (!Capacitor.isNativePlatform()) {
            return null;
        }

        try {
            // Request permission if needed
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                console.log('❌ Contacts permission not granted');
                return null;
            }

            console.log(`🔍 Searching contacts for: "${name}"`);

            // Get all contacts with projection
            const result = await Contacts.getContacts({
                projection: {
                    name: true,
                    phones: true
                }
            });

            if (!result.contacts || result.contacts.length === 0) {
                console.log('❌ No contacts found on device');
                return null;
            }

            console.log(`📇 Total contacts to search: ${result.contacts.length}`);

            // Search for contact by name (case-insensitive, flexible matching)
            const searchName = name.toLowerCase().trim();

            for (const contact of result.contacts) {
                // Access contact name safely with multiple fallbacks
                const displayName = (contact as any).name?.display?.toLowerCase() || '';
                const givenName = (contact as any).name?.given?.toLowerCase() || '';
                const familyName = (contact as any).name?.family?.toLowerCase() || '';
                const middleName = (contact as any).name?.middle?.toLowerCase() || '';

                // Flexible matching: check if search term appears anywhere in any name field
                const matchesDisplay = displayName.includes(searchName) || searchName.includes(displayName);
                const matchesInSearch = displayName && (searchName.includes(displayName.split(' ')[0]) || displayName.includes(searchName));
                const matchesGiven = givenName.includes(searchName) || searchName.includes(givenName);
                const matchesFamily = familyName.includes(searchName) || searchName.includes(familyName);
                const matchesMiddle = middleName.includes(searchName) || searchName.includes(middleName);
                const startsWithGiven = givenName.startsWith(searchName);
                const startsWithDisplay = displayName.startsWith(searchName);

                if (matchesDisplay || matchesGiven || matchesFamily || matchesMiddle ||
                    matchesInSearch || startsWithGiven || startsWithDisplay) {
                    // Get first phone number
                    if (contact.phones && contact.phones.length > 0) {
                        const phoneNumber = contact.phones[0].number;
                        console.log(`✅ FOUND! Display: "${displayName}", Given: "${givenName}", Phone: ${phoneNumber}`);
                        return phoneNumber || null;
                    }
                }
            }

            console.log(`❌  No contact found matching: "${name}"`);
            return null;
        } catch (error) {
            console.error('❌ Error searching contacts:', error);
            return null;
        }
    }
}
