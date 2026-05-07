import React, { useState, useEffect, useRef } from 'react';
import { UserStats, updateStats, initStats } from './data';
import { Settings, Save, Check, Image as ImageIcon, Trash2, Loader2, Link, Clock, PauseCircle, PlayCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export function SettingsTab({ userId, stats }: { userId: string, stats: UserStats | null }) {
  const [consentLink, setConsentLink] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isClockStopped, setIsClockStopped] = useState(false);
  const [manualTimeString, setManualTimeString] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stats?.consentLink) setConsentLink(stats.consentLink);
    if (stats?.backgroundImage) setBackgroundImage(stats.backgroundImage);
    
    setIsClockStopped(stats?.isClockStopped || false);
    if (stats?.manualTimestamp) {
      const d = new Date(stats.manualTimestamp);
      const offset = d.getTimezoneOffset() * 60000;
      const localDate = new Date(d.getTime() - offset);
      setManualTimeString(localDate.toISOString().slice(0, 16));
    } else {
      const d = new Date();
      const offset = d.getTimezoneOffset() * 60000;
      const localDate = new Date(d.getTime() - offset);
      setManualTimeString(localDate.toISOString().slice(0, 16));
    }
  }, [stats]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const manualTimestamp = new Date(manualTimeString).getTime();
      await updateStats(userId, { 
        consentLink, 
        backgroundImage,
        isClockStopped,
        manualTimestamp: isNaN(manualTimestamp) ? Date.now() : manualTimestamp
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetClock = async () => {
    if (confirm('Are you sure you want to reset the Day counter to 1? This will restart your time.')) {
      setIsSaving(true);
      try {
        await updateStats(userId, { startDate: Date.now(), isClockStopped: false });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        console.error(err);
        alert('Failed to reset clock.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // Limit to ~800KB to stay safe under 1MB Firestore limit
      alert("Image is too large. Please select an image under 800KB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setBackgroundImage(base64);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const clearBackground = () => {
    setBackgroundImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-[#ff5a00]" />
        <h2 className="text-2xl font-black uppercase italic text-gray-200">System Settings</h2>
      </div>

      <div className="bg-[#151515] border border-[#2a2a2a] p-6 rounded-tl-[20px] rounded-br-[20px] rounded-tr-md rounded-bl-md">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white uppercase italic flex items-center gap-2">
              <Link className="w-4 h-4 text-[#ff5a00]" /> Links & Forms
            </h3>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                Bestie Consent Link
              </label>
              <input 
                type="url" 
                value={consentLink}
                onChange={e => setConsentLink(e.target.value)}
                placeholder="https://docs.google.com/forms/..."
                className="w-full bg-black/50 border border-[#333] rounded-tl-lg rounded-br-lg p-3 text-white outline-none focus:border-[#ff5a00] transition font-mono text-sm" 
              />
              <p className="text-[10px] text-gray-600 mt-1 italic">Used when marking prospects as "Sent Link"</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#2a2a2a] pt-6">
            <h3 className="text-lg font-bold text-white uppercase italic flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#ff5a00]" /> Visual Identity
            </h3>
            
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                Background Atmosphere
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div 
                    className="w-32 h-20 bg-black/50 border border-[#333] rounded-tl-xl rounded-br-xl overflow-hidden flex items-center justify-center relative group"
                  >
                    {backgroundImage ? (
                      <>
                        <img src={backgroundImage} alt="Preview" className="w-full h-full object-cover opacity-50" />
                        <button 
                          type="button" 
                          onClick={clearBackground}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-700" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-tl-lg rounded-br-lg text-xs font-bold uppercase transition flex items-center gap-2"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        Upload Image
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 uppercase font-medium">Use a subtle or dark image for best readability</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-600 mb-1">Or provide a Direct URL</label>
                  <input 
                    type="text" 
                    value={backgroundImage.startsWith('data:') ? '' : backgroundImage}
                    onChange={e => setBackgroundImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-black/30 border border-[#222] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition text-xs font-mono" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#2a2a2a] pt-6">
            <h3 className="text-lg font-bold text-white uppercase italic flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#ff5a00]" /> Time Physics</span>
              <button 
                type="button"
                onClick={handleResetClock}
                className="text-xs font-bold uppercase flex items-center gap-1 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded transition"
              >
                <RefreshCw className="w-3 h-3" /> Reset Engine (Day 1)
              </button>
            </h3>
            
            <div className="bg-[#111] border border-[#222] p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Time Status</h4>
                  <p className="text-xs text-gray-500">Stop time to freeze the day count and current time.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClockStopped(!isClockStopped)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase text-xs transition ${
                    isClockStopped 
                      ? 'bg-red-500/20 text-red-500 border border-red-500/50' 
                      : 'bg-green-500/20 text-green-500 border border-green-500/50'
                  }`}
                >
                  {isClockStopped ? (
                    <><PauseCircle className="w-4 h-4" /> Clock Stopped</>
                  ) : (
                    <><PlayCircle className="w-4 h-4" /> Clock Running</>
                  )}
                </button>
              </div>

              {isClockStopped && (
                <div className="pt-4 border-t border-[#222]">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                    Manual Override Time
                  </label>
                  <input 
                    type="datetime-local" 
                    value={manualTimeString}
                    onChange={e => setManualTimeString(e.target.value)}
                    className="w-full bg-black/50 border border-[#333] rounded-tl-lg rounded-br-lg p-3 text-white outline-none focus:border-[#ff5a00] transition font-mono text-sm" 
                  />
                  <p className="text-[10px] text-gray-600 mt-2 italic">Set the exact time you want the system to be anchored in while stopped.</p>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving || isUploading}
            className="bg-[#ff5a00] text-black font-bold uppercase tracking-widest px-8 py-4 rounded-tl-xl rounded-br-xl hover:bg-[#ff7a33] transition flex items-center gap-2 w-full md:w-auto shadow-[0_10px_20px_rgba(255,90,0,0.2)] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <Check className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? 'Processing...' : saved ? 'Updated' : 'Deploy Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
