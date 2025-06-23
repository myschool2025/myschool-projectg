import { useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { isMobile, isTablet, isBrowser } from 'react-device-detect';
import { v4 as uuidv4 } from 'uuid';
import UAParser from 'ua-parser-js';

export interface Session {
    id: string;
    userId: string;
    deviceType: string;
    browser: {
        name: string;
        version: string;
        engine: string;
    };
    os: {
        name: string;
        version: string;
        platform: string;
    };
    ip: string;
    location: {
        city: string;
        country: string;
        region: string;
        latitude: number;
        longitude: number;
        timezone: string;
    };
    lastActive: Timestamp;
    isActive: boolean;
    isCurrent: boolean;
    createdAt: Timestamp;
    sessionId: string;
    userAgent: string;
    screenResolution: string;
    language: string;
    security: {
        isVPN: boolean;
        isProxy: boolean;
        isTor: boolean;
        isIncognito: boolean;
        isSuspicious: boolean;
        lastSecurityCheck: Timestamp;
    };
}

const getDeviceType = () => {
    if (isMobile) {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return 'Mobile App';
        }
        return 'Mobile';
    }
    if (isTablet) return 'Tablet';
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'Desktop App';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'Smart TV';
    }
    if (window.matchMedia('(max-width: 300px)').matches) {
        return 'Smartwatch';
    }
    return 'Desktop';
};

const getDetailedBrowserInfo = () => {
    try {
        const parser = new (UAParser as any)();
        const result = parser.getResult();

        return {
            browser: {
                name: result.browser.name || 'Unknown',
                version: result.browser.version || 'Unknown',
                engine: result.engine.name || 'Unknown'
            },
            os: {
                name: result.os.name || 'Unknown',
                version: result.os.version || 'Unknown',
                platform: result.device.type || 'Unknown'
            }
        };
    } catch (error) {
        console.error('Error getting browser info:', error);
        return {
            browser: {
                name: 'Unknown',
                version: 'Unknown',
                engine: 'Unknown'
            },
            os: {
                name: 'Unknown',
                version: 'Unknown',
                platform: 'Unknown'
            }
        };
    }
};

const getLocationInfo = async (ip: string) => {
    try {
        // Try HTML5 Geolocation first
        if (navigator.geolocation) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });

            // Get location details from coordinates
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();

            return {
                city: data.address?.city || data.address?.town || 'Unknown',
                country: data.address?.country || 'Unknown',
                region: data.address?.state || 'Unknown',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        }
    } catch (error) {
        console.error('Error getting HTML5 location:', error);
    }

    // Fallback to IP-based location
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        if (data.error) {
            throw new Error('IP API error');
        }

        return {
            city: data.city || 'Unknown',
            country: data.country_name || 'Unknown',
            region: data.region || 'Unknown',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    } catch (error) {
        console.error('Error fetching IP location:', error);
        return {
            city: 'Unknown',
            country: 'Unknown',
            region: 'Unknown',
            latitude: 0,
            longitude: 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
};

const checkSecurity = async (ip: string) => {
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        // Check for Tor exit nodes
        const torResponse = await fetch(`https://check.torproject.org/torbulkexitlist`);
        const torList = await torResponse.text();
        const isTor = torList.includes(ip);

        // Check for incognito mode
        const isIncognito = !window.localStorage || !window.sessionStorage;

        return {
            isVPN: Boolean(data.proxy || data.vpn),
            isProxy: Boolean(data.proxy),
            isTor,
            isIncognito,
            isSuspicious: Boolean(data.proxy || data.vpn || isTor),
            lastSecurityCheck: Timestamp.now()
        };
    } catch (error) {
        console.error('Error checking security:', error);
        return {
            isVPN: false,
            isProxy: false,
            isTor: false,
            isIncognito: false,
            isSuspicious: false,
            lastSecurityCheck: Timestamp.now()
        };
    }
};

export const useDeviceTracking = () => {
    useEffect(() => {
        const trackDevice = async (userId: string) => {
            try {
                const sessionId = uuidv4();
                const { browser, os } = getDetailedBrowserInfo();
                const deviceType = getDeviceType();
                const userAgent = navigator.userAgent;
                const screenResolution = `${window.screen.width}x${window.screen.height}`;
                const language = navigator.language;

                // Get IP address
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                const ip = ipData.ip;

                // Get location and security info
                const [locationData, securityInfo] = await Promise.all([
                    getLocationInfo(ip),
                    checkSecurity(ip)
                ]);

                const sessionData: Omit<Session, 'id'> = {
                    userId,
                    deviceType,
                    browser,
                    os,
                    ip,
                    location: locationData,
                    lastActive: serverTimestamp() as Timestamp,
                    isActive: true,
                    isCurrent: true,
                    createdAt: serverTimestamp() as Timestamp,
                    sessionId,
                    userAgent,
                    screenResolution,
                    language,
                    security: securityInfo
                };

                const sessionRef = await addDoc(collection(db, 'sessions'), sessionData);

                // Update other sessions to not current
                const sessionsRef = collection(db, 'sessions');
                const q = query(
                    sessionsRef,
                    where('userId', '==', userId),
                    where('isCurrent', '==', true)
                );
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach(async (doc) => {
                    if (doc.data().sessionId !== sessionId) {
                        await updateDoc(doc.ref, {
                            isCurrent: false
                        });
                    }
                });

                // Listen for session deletion
                const unsubscribe = onSnapshot(doc(db, 'sessions', sessionRef.id), (doc) => {
                    if (!doc.exists()) {
                        auth.signOut();
                    }
                });

                return unsubscribe;
            } catch (error) {
                console.error('Error tracking device:', error);
            }
        };

        const updateLastActive = async (userId: string) => {
            try {
                const sessionsRef = collection(db, 'sessions');
                const q = query(
                    sessionsRef,
                    where('userId', '==', userId),
                    where('isActive', '==', true)
                );
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach(async (doc) => {
                    await updateDoc(doc.ref, {
                        lastActive: serverTimestamp()
                    });
                });
            } catch (error) {
                console.error('Error updating session:', error);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                trackDevice(user.uid);
                const interval = setInterval(() => updateLastActive(user.uid), 5 * 60 * 1000);
                return () => clearInterval(interval);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);
};

const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
};

const getOSInfo = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
};