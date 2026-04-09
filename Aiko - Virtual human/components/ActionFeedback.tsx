import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ActionFeedbackProps {
    message: string;
    type: 'success' | 'error' | 'loading';
    onDismiss?: () => void;
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        if (type !== 'loading' && onDismiss) {
            const timer = setTimeout(onDismiss, 3000);
            return () => clearTimeout(timer);
        }
    }, [type, onDismiss]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-400" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'loading':
                return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-900/40 border-green-500/50';
            case 'error':
                return 'bg-red-900/40 border-red-500/50';
            case 'loading':
                return 'bg-blue-900/40 border-blue-500/50';
        }
    };

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${getStyles()}`}>
                {getIcon()}
                <span className="text-white font-medium text-sm">{message}</span>
            </div>
        </div>
    );
};
