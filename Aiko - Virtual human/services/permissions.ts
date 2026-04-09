import { Capacitor } from '@capacitor/core';

declare const AndroidPermissions: any;

export class PermissionManager {
    /**
     * Request all required permissions for Aiko
     */
    static async requestAllPermissions(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            console.log('Not on native platform, skipping permission requests');
            return;
        }

        try {
            // For Android, we need to request permissions at runtime
            if (Capacitor.getPlatform() === 'android') {
                await this.requestAndroidPermissions();
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
        }
    }

    /**
     * Request Android-specific permissions
     */
    private static async requestAndroidPermissions(): Promise<void> {
        // Check if we can access the Android Permissions API
        if (typeof (window as any).cordova !== 'undefined') {
            const permissions = [
                'android.permission.RECORD_AUDIO',
                'android.permission.CAMERA',
                'android.permission.CALL_PHONE',
                'android.permission.READ_PHONE_STATE'
            ];

            // Request permissions one by one
            for (const permission of permissions) {
                try {
                    await this.requestPermission(permission);
                } catch (err) {
                    console.warn(`Failed to request ${permission}:`, err);
                }
            }
        }
    }

    /**
     * Request a single permission
     */
    private static requestPermission(permission: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof (window as any).cordova === 'undefined') {
                resolve();
                return;
            }

            const permissions = (window as any).cordova.plugins.permissions;

            permissions.checkPermission(permission,
                (status: any) => {
                    if (status.hasPermission) {
                        console.log(`Permission ${permission} already granted`);
                        resolve();
                    } else {
                        permissions.requestPermission(permission,
                            (status: any) => {
                                if (status.hasPermission) {
                                    console.log(`Permission ${permission} granted`);
                                    resolve();
                                } else {
                                    console.warn(`Permission ${permission} denied`);
                                    reject();
                                }
                            },
                            () => reject()
                        );
                    }
                },
                () => reject()
            );
        });
    }
}
