import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [connectionType, setConnectionType] = useState<'4g' | '3g' | '2g' | 'slow' | 'fast'>('fast');

    useEffect(() => {
        const handleOnline = () => {
            console.log('[Network] 🟢 Connection restored');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('[Network] 🔴 Connection lost');
            setIsOnline(false);
        };

        // Monitor connection speed
        const checkConnectionSpeed = () => {
            const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
            
            if (connection) {
                const effectiveType = connection.effectiveType;
                console.log(`[Network] Connection type: ${effectiveType}`);
                
                if (effectiveType === '4g') {
                    setConnectionType('4g');
                } else if (effectiveType === '3g') {
                    setConnectionType('3g');
                } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
                    setConnectionType('2g');
                } else {
                    setConnectionType('slow');
                }
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        checkConnectionSpeed();
        const interval = setInterval(checkConnectionSpeed, 30000); // Check every 30s

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return { isOnline, connectionType };
};
