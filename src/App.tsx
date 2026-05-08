import React, { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from './AuthContext';
import { GCRecord, BestieRecord, UserStats, subscribeToGCs, subscribeToBesties, subscribeToStats, addGC, updateGC, addBestie, updateBestie, initStats } from './data';
import { generatePitch } from './ai';
import { LogIn, Plus, Swords, UserPlus, FileText, Send, UserX, UserCheck, Flame, Loader2, Sparkles, MessageSquare, Activity, Users, Settings, LogOut } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PitchesTab } from './PitchesTab';
import { GCTab } from './GCTab';
import { BestiesTab } from './BestiesTab';
import { SettingsTab } from './SettingsTab';

function Dashboard() {
  const { user, logout } = useAuth();
  const [gcs, setGcs] = useState<GCRecord[]>([]);
  const [besties, setBesties] = useState<BestieRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'gcs' | 'besties' | 'pitches' | 'settings'>('overview');

  useEffect(() => {
    if (!user) return;
    const unsubGcs = subscribeToGCs(user.uid, setGcs);
    const unsubBesties = subscribeToBesties(user.uid, setBesties);
    const unsubStats = subscribeToStats(user.uid, (fetchedStats) => {
      if (!fetchedStats) {
        // Initialize day 97 start date
        const day97Ms = Date.now() - (96 * 24 * 60 * 60 * 1000);
        initStats(user.uid, day97Ms);
      } else {
        setStats(fetchedStats);
      }
    });

    return () => {
      unsubGcs();
      unsubBesties();
      unsubStats();
    };
  }, [user]);

  // Compute stats based on calendar days, updating at midnight
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (stats?.isClockStopped) {
      if (stats.manualTimestamp) {
        setNow(new Date(stats.manualTimestamp));
      }
    } else {
      setNow(new Date());
      const interval = setInterval(() => setNow(new Date()), 1000); // Check every second for the clock
      return () => clearInterval(interval);
    }
  }, [stats?.isClockStopped, stats?.manualTimestamp]);

  const currentDay = React.useMemo(() => {
    if (!stats?.startDate) return 97;
    const start = new Date(stats.startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }, [stats?.startDate, now]);

  const totalGcs = gcs.length;
  // ... rest of stats
  const totalPitches = gcs.reduce((acc, gc) => acc + gc.pitchCount, 0);
  const totalAgreed = besties.filter(b => b.status === 'Agreed').length;
  const totalRejected = besties.filter(b => b.status === 'Rejected').length;
  
  const successRate = totalPitches > 0 ? Math.round((totalAgreed / totalPitches) * 100) : 0;
  
  // Calculate weekly streak (pitches in last 7 days)
  const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const weeklyPitches = gcs.filter(gc => gc.updatedAt > last7Days).reduce((acc, gc) => acc + (gc.pitchCount > 0 ? 1 : 0), 0); // Simplified: count GCs pitched in this week

  const topBesties = besties.filter(b => b.status === 'Agreed').slice(0, 5);

  return (
    <div 
      className="min-h-[100dvh] bg-[#0d0d0d] text-white flex flex-col"
      style={stats?.backgroundImage ? { 
        backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.9), rgba(13,13,13,0.98)), url(${stats.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Header */}
      <header className="border-b border-[#333] bg-[#1a1a1a]/95 backdrop-blur-xl sticky top-0 z-50 pt-safe">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#ff5a00] to-[#ff9900] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,90,0,0.3)]">
              <Swords className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-2xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2 leading-none">
                BRM System
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#ff5a00] fill-[#ff5a00]" />
                  <p className="text-[10px] md:text-xs text-[#ff5a00] font-mono tracking-widest font-bold">
                    DAY {currentDay}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-[#333]">
              {(['overview', 'gcs', 'besties', 'pitches', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all rounded-lg",
                    activeTab === tab 
                      ? "bg-[#ff5a00] text-black shadow-[0_0_10px_rgba(255,90,0,0.3)]" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {tab}
                </button>
              ))}
            </nav>
            
            <button 
              onClick={logout}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 overflow-y-auto pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard 
                  title="Total GCs" 
                  value={totalGcs} 
                  icon={<MessageSquare className="w-5 h-5 text-[#ff5a00]" />} 
                />
                <StatCard 
                  title="Total Pitches" 
                  value={totalPitches} 
                  icon={<Send className="w-5 h-5 text-[#ff5a00]" />} 
                />
                <StatCard 
                  title="Agreements" 
                  value={totalAgreed} 
                  icon={<UserCheck className="w-5 h-5 text-green-500" />} 
                />
                <StatCard 
                  title="Weekly Streak" 
                  value={weeklyPitches} 
                  icon={<Flame className="w-5 h-5 text-orange-500" />} 
                />
                <StatCard 
                  title="Success Rate" 
                  value={`${successRate}%`} 
                  icon={<Flame className="w-5 h-5 text-[#ff5a00]" />} 
                />
              </div>

              {/* Top 5 Besties */}
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5a00] opacity-5 filter blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
                <h2 className="text-xl font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Flame className="text-[#ff5a00]" /> 
                  Top 5 Besties 
                </h2>
                
                {topBesties.length === 0 ? (
                  <p className="text-gray-500 italic">No besties found yet... keep pitching!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {topBesties.map((bestie, idx) => (
                      <div key={bestie.id} className="bg-black/50 border border-[#333] p-4 rounded-tl-2xl rounded-br-2xl rounded-tr-md rounded-bl-md relative group">
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-[#ff5a00] to-orange-400 text-black font-black flex items-center justify-center rounded-tl-lg rounded-br-lg z-10 shadow-lg">
                          #{idx + 1}
                        </div>
                        <h3 className="font-bold text-lg truncate mt-2">{bestie.realName}</h3>
                        <p className="text-xs text-gray-400 mt-1 truncate">{bestie.contactIdentity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'gcs' && (
            <motion.div key="gcs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GCTab userId={user.uid} gcs={gcs} />
            </motion.div>
          )}

          {activeTab === 'besties' && (
            <motion.div key="besties" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BestiesTab userId={user.uid} besties={besties} gcs={gcs} />
            </motion.div>
          )}

          {activeTab === 'pitches' && (
            <motion.div key="pitches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PitchesTab currentDay={currentDay} now={now} gcs={gcs} stats={stats} userId={user.uid} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsTab userId={user.uid} stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar - Material Style */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/95 backdrop-blur-2xl border-t border-white/5 z-50 px-2 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-around items-center">
        {[
          { id: 'overview', icon: Activity, label: 'Stats' },
          { id: 'gcs', icon: MessageSquare, label: 'GCs' },
          { id: 'pitches', icon: Send, label: 'Pitch' },
          { id: 'besties', icon: Users, label: 'Besties' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className="relative flex flex-col items-center justify-center p-2 min-w-[64px]"
          >
            <div className={cn(
              "p-2 rounded-2xl transition-all duration-300",
              activeTab === item.id 
                ? "bg-[#ff5a00] text-black scale-110 shadow-[0_0_15px_rgba(255,90,0,0.4)]" 
                : "text-gray-500"
            )}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-[9px] uppercase font-bold mt-1 transition-all",
              activeTab === item.id ? "text-[#ff5a00] opacity-100" : "text-gray-600 opacity-0"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-[#151515] border border-[#2a2a2a] p-6 rounded-tl-[20px] rounded-br-[20px] rounded-tr-md rounded-bl-md hover:border-[#ff5a00]/50 transition-colors group">
      <div className="flex justify-between items-start">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <div className="p-2 bg-black/40 rounded-tl-lg rounded-br-lg group-hover:bg-[#ff5a00]/10 transition-colors">
          {icon}
        </div>
      </div>
      <p className="text-4xl font-black mt-4 tracking-tighter">{value}</p>
    </div>
  );
}

// ... other tabs ...

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading, login, emailLogin, emailSignUp, resetPassword } = useAuth();
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff5a00]" />
      </div>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        await emailSignUp(email, password);
      } else {
        await emailLogin(email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password login is not enabled in your Firebase Console. Go to Authentication > Sign-in method to enable it.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This identity is already registered. Please Switch to 'System Enter' mode below.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid credentials. If you haven't registered yet, use 'Request Access' mode.");
      } else if (err.code === 'auth/weak-password') {
        setError("Security alert: Password must be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setError('');
    setSuccess('');
    setAuthLoading(true);
    try {
      await resetPassword(email);
      setSuccess("Reset link dispatched to your secure terminal (email). Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Reset request failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden px-4">
        <div className="absolute w-[800px] h-[800px] bg-[#ff5a00] opacity-10 rounded-full blur-[120px] -top-96 -left-96 pointer-events-none" />
        <div className="z-10 text-center space-y-8 w-full max-w-sm">
          <div className="bg-[#1a1a1a] p-8 md:p-12 border border-[#333] rounded-tl-[40px] rounded-br-[40px] rounded-tr-xl rounded-bl-xl shadow-2xl relative">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">BRM System</h1>
            <p className="text-gray-400 max-w-sm mb-8 mx-auto text-sm md:text-base">Manage your online bestie search mission with precision.</p>
            
            {isEmailMode ? (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-[#0d0d0d] border border-[#333] p-3 rounded-lg text-white focus:border-[#ff5a00] outline-none transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {!isSignUp && (
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full bg-[#0d0d0d] border border-[#333] p-3 rounded-lg text-white focus:border-[#ff5a00] outline-none transition-colors"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-[#ff5a00] font-bold uppercase"
                    >
                      Forgot?
                    </button>
                  </div>
                )}
                {isSignUp && (
                  <input
                    type="password"
                    placeholder="Set Password"
                    className="w-full bg-[#0d0d0d] border border-[#333] p-3 rounded-lg text-white focus:border-[#ff5a00] outline-none transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                )}
                {error && <p className="text-red-500 text-xs font-bold text-left">{error}</p>}
                {success && <p className="text-green-500 text-xs font-bold text-left">{success}</p>}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="bg-[#ff5a00] hover:bg-[#ff7020] text-black w-full py-4 px-8 font-black uppercase text-lg tracking-widest transition-transform hover:scale-105 active:scale-95 rounded-tl-xl rounded-br-xl rounded-tr-md rounded-bl-md flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,90,0,0.4)] disabled:opacity-50"
                >
                  {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Finalize Access' : 'Authenticate')}
                </button>
                <div className="flex flex-col gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[#ff5a00] text-sm font-bold hover:brightness-125 transition-all py-2 border border-[#ff5a00]/20 rounded-lg bg-[#ff5a00]/5"
                  >
                    {isSignUp ? 'Already registered? Switch to Login' : 'New operator? Register ID'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailMode(false);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-gray-500 text-xs hover:text-white transition-colors"
                  >
                    Back to Google Login
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={login}
                  className="bg-[#ff5a00] hover:bg-[#ff7020] text-black w-full py-4 px-8 font-black uppercase text-lg tracking-widest transition-all hover:scale-105 active:scale-95 rounded-tl-xl rounded-br-xl rounded-tr-md rounded-bl-md flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,90,0,0.4)]"
                >
                  <LogIn className="w-5 h-5" />
                  Enter System
                </button>
                <button
                  onClick={() => setIsEmailMode(true)}
                  className="text-gray-500 hover:text-white text-xs font-bold transition-colors uppercase tracking-[0.2em]"
                >
                  Use Internal ID (Email/Pass)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
