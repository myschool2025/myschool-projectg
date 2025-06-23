import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, orderBy, deleteDoc, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { Shield, Laptop, Smartphone, Tablet, LogOut, AlertCircle, Power, Key, Eye, EyeOff, Monitor, Watch, Lock, Unlock, ShieldAlert, AlertTriangle, Globe, Clock, Globe2, Network, MonitorSmartphone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Loading from '@/components/loader/Loading';
import { useNavigate } from 'react-router-dom';
import { FaChrome, FaFirefox, FaSafari, FaEdge, FaOpera } from 'react-icons/fa';
import { SiBrave } from 'react-icons/si';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Session {
    id: string;
    userId: string;
    deviceType: string;
    browser: string;
    os: string;
    ip: string;
    location: string;
    lastActive: Timestamp;
    isActive: boolean;
    isCurrent: boolean;
    createdAt: Timestamp;
    sessionId: string;
    userAgent: string;
    screenResolution: string;
    language: string;
    timezone: string;
}

const LoginDevices = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            if (user) {
                loadSessions(user.uid);
            } else {
                setLoading(false);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const loadSessions = async (userId) => {
        try {
            setLoading(true);
            const sessionsRef = collection(db, 'sessions');
            const q = query(
                sessionsRef,
                where('userId', '==', userId),
                orderBy('lastActive', 'desc')
            );

            const unsubscribe = onSnapshot(q,
                (querySnapshot) => {
                    const sessionsData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Session[];
                    setSessions(sessionsData);
                    setLoading(false);
                },
                (error) => {
                    console.error('Error in session listener:', error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to load sessions. Please try again."
                    });
                    setLoading(false);
                }
            );

            return unsubscribe;
        } catch (error) {
            console.error('Error loading sessions:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load sessions. Please try again."
            });
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentUser || !password || !newPassword || !confirmPassword) return;

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "New passwords do not match."
            });
            return;
        }

        if (newPassword.length < 6) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Password must be at least 6 characters long."
            });
            return;
        }

        setVerifying(true);
        try {
            // Verify current password
            await signInWithEmailAndPassword(auth, currentUser.email, password);

            // Update password
            await updatePassword(currentUser, newPassword);

            toast({
                title: "Success",
                description: "Password updated successfully."
            });

            setShowPasswordDialog(false);
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error changing password:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to change password. Please check your current password and try again."
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleLogoutSession = async () => {
        if (!selectedSession || !currentUser) return;

        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(
                currentUser.email!,
                password
            );
            await reauthenticateWithCredential(currentUser, credential);
            await deleteDoc(doc(db, 'sessions', selectedSession.id));
            setSessions(sessions.filter(session => session.id !== selectedSession.id));

            // If logging out current session, sign out and navigate
            if (selectedSession.isCurrent) {
                await signOut(auth);
                navigate('/login');
            }

            toast({
                title: "Success",
                description: "Session logged out successfully."
            });
            setShowLogoutDialog(false);
            setPassword('');
            setSelectedSession(null);
        } catch (error) {
            console.error('Error logging out session:', error);
            if (error.code === 'permission-denied') {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You don't have permission to manage sessions. Please contact support."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to log out session. Please check your password and try again."
                });
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleLogoutAllSessions = async () => {
        if (!currentUser) return;

        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(
                currentUser.email!,
                password
            );
            await reauthenticateWithCredential(currentUser, credential);
            const sessionsToDelete = sessions.filter(session => !session.isCurrent);
            const deletePromises = sessionsToDelete.map(session =>
                deleteDoc(doc(db, 'sessions', session.id))
            );
            await Promise.all(deletePromises);
            setSessions(sessions.filter(session => session.isCurrent));

            toast({
                title: "Success",
                description: "All other sessions logged out successfully."
            });
            setShowLogoutDialog(false);
            setPassword('');
            setSelectedSession(null);
        } catch (error) {
            console.error('Error logging out sessions:', error);
            if (error.code === 'permission-denied') {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You don't have permission to manage sessions. Please contact support."
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to log out sessions. Please check your password and try again."
                });
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleUserLogout = async () => {
        try {
            // Delete current session from Firestore
            const currentSession = sessions.find(session => session.isCurrent);
            if (currentSession) {
                await deleteDoc(doc(db, 'sessions', currentSession.id));
            }

            // Sign out from Firebase Auth
            await signOut(auth);

            toast({
                title: "Success",
                description: "You have been logged out successfully."
            });

            // Navigate to login page
            navigate('/login');
        } catch (error) {
            console.error('Error logging out user:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to log out. Please try again."
            });
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType.toLowerCase()) {
            case 'mobile':
            case 'mobile app':
                return <Smartphone className="h-5 w-5" />;
            case 'tablet':
                return <Tablet className="h-5 w-5" />;
            case 'smart tv':
                return <Monitor className="h-5 w-5" />;
            case 'smartwatch':
                return <Watch className="h-5 w-5" />;
            default:
                return <Laptop className="h-5 w-5" />;
        }
    };

    const getBrowserIcon = (browser: string | undefined) => {
        if (!browser) return 'globe';

        const name = browser.toLowerCase();
        if (name.includes('chrome')) return 'chrome';
        if (name.includes('firefox')) return 'firefox';
        if (name.includes('safari')) return 'safari';
        if (name.includes('edge')) return 'edge';
        if (name.includes('opera')) return 'opera';
        if (name.includes('brave')) return 'brave';
        return 'globe';
    };

    const formatLocation = (location: string) => {
        return location || 'Unknown Location';
    };

    const formatLastActive = (timestamp: any) => {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loading />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4">
                <p className="text-lg text-gray-500 text-center">Please log in to view your sessions.</p>
            </div>
        );
    }

    const currentSession = sessions.find(s => s.isCurrent);
    const otherSessions = sessions.filter(s => !s.isCurrent);

    return (
        <motion.div
            className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-6xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Active Sessions</h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowPasswordDialog(true)}
                        className="w-full sm:w-auto border-gray-300 hover:bg-gray-100"
                    >
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleUserLogout}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Power className="h-4 w-4 mr-2" />
                        Log Out
                    </Button>
                    {sessions.length > 1 && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedSession(null);
                                setShowLogoutDialog(true);
                            }}
                            className="w-full sm:w-auto border-gray-300 hover:bg-gray-100"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out All Other Sessions
                        </Button>
                    )}
                </div>
            </div>

            <Alert className="mb-4 sm:mb-6 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Security Notice</AlertTitle>
                <AlertDescription className="text-yellow-700">
                    If you notice any suspicious activity, please log out all other sessions and change your password immediately.
                </AlertDescription>
            </Alert>

            {loading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                    <Loading />
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">No active sessions found.</p>
                </div>
            ) : (
                <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6" variants={containerVariants}>
                    {currentSession && (
                        <motion.div variants={itemVariants} className="lg:col-span-2">
                            <Card className="border-2 border-green-500 bg-green-50/50">
                                <CardHeader className="bg-green-50 border-b border-green-100">
                                    <CardTitle className="flex items-center gap-2 text-green-700">
                                        <Shield className="h-5 w-5 text-green-500" />
                                        Current Session
                                    </CardTitle>
                                    <CardDescription className="text-green-600">
                                        This is your current active session
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
                                            {getDeviceIcon(currentSession.deviceType)}
                                            <div>
                                                <p className="text-sm text-gray-500">Device</p>
                                                <p className="font-medium">{currentSession.deviceType}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
                                            <img
                                                src={`/browser-icons/${getBrowserIcon(currentSession.browser)}.svg`}
                                                alt={currentSession.browser}
                                                className="h-5 w-5"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/browser-icons/globe.svg';
                                                }}
                                            />
                                            <div>
                                                <p className="text-sm text-gray-500">Browser</p>
                                                <p className="font-medium">{currentSession.browser}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
                                            <MonitorSmartphone className="h-5 w-5" />
                                            <div>
                                                <p className="text-sm text-gray-500">OS</p>
                                                <p className="font-medium">{currentSession.os}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
                                            <Globe className="h-5 w-5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Location</p>
                                                <p className="font-medium">{formatLocation(currentSession.location)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
                                            <Globe2 className="h-5 w-5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Timezone</p>
                                                <p className="font-medium">{currentSession.timezone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
                                            <Network className="h-5 w-5" />
                                            <div>
                                                <p className="text-sm text-gray-500">IP Address</p>
                                                <p className="font-medium">{currentSession.ip}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-2 bg-white rounded-lg shadow-sm">
                                        <p className="text-sm text-gray-500 mb-1">User Agent</p>
                                        <p className="text-sm font-mono truncate">{currentSession.userAgent}</p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-green-600">
                                        <Clock className="h-5 w-5" />
                                        <span>Last active: {formatLastActive(currentSession.lastActive)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {otherSessions.length > 0 && (
                        <motion.div variants={itemVariants} className="lg:col-span-2">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Other Active Sessions</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {otherSessions.map((session) => (
                                            <motion.div
                                                key={session.id}
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="h-full"
                                            >
                                                <Card className="h-full hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-2">
                                                                {getDeviceIcon(session.deviceType)}
                                                                <span className="font-medium">{session.deviceType}</span>
                                                            </div>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedSession(session);
                                                                    setShowLogoutDialog(true);
                                                                }}
                                                            >
                                                                Log Out
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={`/browser-icons/${getBrowserIcon(session.browser)}.svg`}
                                                                    alt={session.browser}
                                                                    className="h-5 w-5"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = '/browser-icons/globe.svg';
                                                                    }}
                                                                />
                                                                <span>{session.browser}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MonitorSmartphone className="h-5 w-5" />
                                                                <span>{session.os}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Globe className="h-5 w-5" />
                                                                <span className="truncate">{formatLocation(session.location)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-5 w-5" />
                                                                <span>Last active: {formatLastActive(session.lastActive)}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Password Change Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={(open) => {
                setShowPasswordDialog(open);
                if (!open) {
                    setPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPassword(false);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            Change Password
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Please enter your current password and choose a new password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Current Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPasswordDialog(false);
                                setPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setShowPassword(false);
                                setShowNewPassword(false);
                                setShowConfirmPassword(false);
                            }}
                            className="w-full sm:w-auto border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handlePasswordChange}
                            disabled={!password || !newPassword || !confirmPassword || verifying}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                        >
                            {verifying ? 'Updating...' : 'Update Password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showLogoutDialog} onOpenChange={(open) => {
                setShowLogoutDialog(open);
                if (!open) {
                    setPassword('');
                    setSelectedSession(null);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            {selectedSession ? 'Log Out Session' : 'Log Out All Other Sessions'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Please enter your password to confirm logging out {selectedSession ? 'this session' : 'all other sessions'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowLogoutDialog(false);
                                setPassword('');
                                setSelectedSession(null);
                            }}
                            className="w-full sm:w-auto border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={selectedSession ? handleLogoutSession : handleLogoutAllSessions}
                            disabled={!password || verifying}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                        >
                            {verifying ? 'Verifying...' : 'Confirm Logout'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

export default LoginDevices;