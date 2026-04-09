import React from 'react';
import { X } from 'lucide-react';

interface AboutProps {
    onClose: () => void;
}

export const About: React.FC<AboutProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                        About Aiko
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4 text-white/80">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Aiko - Virtual Human
                        </h3>
                        <p className="text-sm leading-relaxed">
                            Your AI-powered virtual assistant with voice control and device automation.
                            Aiko can have conversations, answer questions, and help control your device - all through natural voice commands.
                        </p>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <p className="text-sm">
                            <span className="text-white font-medium">Version:</span> 1.0.0
                        </p>
                    </div>

                    {/* Teched Studios Credit */}
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Teched Studios</p>
                                <p className="text-xs text-white/60">Developer</p>
                            </div>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Crafted with 💜 by Teched Studios
                        </p>
                    </div>

                    {/* Features */}
                    <div className="border-t border-white/10 pt-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Features</h4>
                        <ul className="text-sm space-y-1 text-white/70">
                            <li>• Voice-activated "Hey Aiko" wake word</li>
                            <li>• Natural language conversations</li>
                            <li>• Device control & app launching</li>
                            <li>• World knowledge & information</li>
                            <li>• Emotional responses with personality</li>
                        </ul>
                    </div>
                </div>

                {/* Debug Tools */}
                <div className="mt-4 border-t border-white/10 pt-4">
                    <h4 className="text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">Debug Tools</h4>
                    <button
                        onClick={() => {
                            import('../services/notificationService').then(({ NotificationService }) => {
                                NotificationService.sendTestNotification();
                                alert('Scheduled! Close app now. Wait 5s.');
                            });
                        }}
                        className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-xs text-white/70 rounded-lg transition-colors border border-white/5"
                    >
                        Test Notification (5s Delay)
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
};
