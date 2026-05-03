import React, { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from './AuthContext';
import { GCRecord, BestieRecord, UserStats, subscribeToGCs, subscribeToBesties, subscribeToStats, addGC, updateGC, addBestie, updateBestie, initStats } from './data';
import { generatePitch } from './ai';
import { LogIn, Plus, Swords, UserPlus, FileText, Send, UserX, UserCheck, Flame, Loader2, Sparkles, MessageSquare } from 'lucide-react';
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

  // Compute stats
  const currentDay = stats?.startDate 
    ? Math.floor((Date.now() - stats.startDate) / (1000 * 60 * 60 * 24)) + 1 
    : 97;

  const totalGcs = gcs.length;
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
      className="min-h-screen bg-[#0d0d0d] text-white"
      style={stats?.backgroundImage ? { 
        backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.85), rgba(13,13,13,0.95)), url(${stats.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {/* Header */}
      <header className="border-b border-[#333] bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ff5a00] to-[#ff9900] rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm flex items-center justify-center shadow-[0_0_15px_rgba(255,90,0,0.4)]">
              <Swords className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                BRM System
              </h1>
              <p className="text-xs text-[#ff5a00] font-mono tracking-widest font-bold">
                DAY {currentDay} OF BESTIE SEARCH 💫
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-2 bg-black/40 p-1 rounded-tl-xl rounded-br-xl rounded-tr-sm rounded-bl-sm border border-[#333]">
              {(['overview', 'gcs', 'besties', 'pitches', 'settings'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm",
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
              className="text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
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
              <PitchesTab currentDay={currentDay} />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsTab userId={user.uid} stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
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
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff5a00]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute w-[800px] h-[800px] bg-[#ff5a00] opacity-10 rounded-full blur-[120px] -top-96 -left-96 pointer-events-none" />
        <div className="z-10 text-center space-y-8">
          <div className="bg-[#1a1a1a] p-12 border border-[#333] rounded-tl-[40px] rounded-br-[40px] rounded-tr-xl rounded-bl-xl shadow-2xl relative">
            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">BRM System</h1>
            <p className="text-gray-400 max-w-sm mb-8">Manage your online bestie search mission with precision.</p>
            <button
              onClick={login}
              className="bg-[#ff5a00] hover:bg-[#ff7020] text-black w-full py-4 px-8 font-black uppercase text-lg tracking-widest transition-transform hover:scale-105 active:scale-95 rounded-tl-xl rounded-br-xl rounded-tr-md rounded-bl-md flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,90,0,0.4)]"
            >
              <LogIn className="w-5 h-5" />
              Enter System
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
