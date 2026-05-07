import React, { useState, useMemo } from 'react';
import { generatePitch } from './ai';
import { GCRecord, UserStats, updateGC } from './data';
import { Sparkles, Loader2, Copy, FileText, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PitchesTab({ currentDay, now, gcs, stats, userId }: { 
  currentDay: number, 
  now: Date, 
  gcs: GCRecord[], 
  stats: UserStats | null,
  userId: string
}) {
  const [aiPitches, setAiPitches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [flavor, setFlavor] = useState('');
  const [selectedGcId, setSelectedGcId] = useState<string>('');

  const activeTelegramGcs = useMemo(() => 
    gcs.filter(gc => gc.platform === 'Telegram' && (!gc.status || gc.status === 'Active')), 
    [gcs]
  );

  React.useEffect(() => {
    if (!selectedGcId && activeTelegramGcs.length > 0) {
      setSelectedGcId(activeTelegramGcs[0].id);
    }
  }, [activeTelegramGcs, selectedGcId]);

  const currentDateString = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const defaultPitches = useMemo(() => [
    `Hemlo, It's introverted Pain 😶‍🌫️ still searching for bestie, day ${currentDay}💫`,
    `Mai ek introvert person hu 😶‍🌫️ Mera aaj day ${currentDay} hai bestie ki talash mein💫`
  ], [currentDay]);

  const allPitches = [...aiPitches, ...defaultPitches];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generated = await generatePitch(currentDay, flavor);
      if (generated.length > 0) {
        setAiPitches(prev => [...generated, ...prev]);
        setFlavor('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSendTelegram = async (pitch: string, pitchIdx: string) => {
    if (!selectedGcId) {
      alert("Please select a Group Chat from the dropdown first.");
      return;
    }

    const selectedGc = gcs.find(g => g.id === selectedGcId);
    if (!selectedGc?.telegramChatId) {
      alert("The selected GC doesn't have a Telegram Username or Link set. Please update it in the GCs tab.");
      return;
    }

    setSendingId(pitchIdx);
    try {
      // 1. Copy to clipboard
      try {
        await navigator.clipboard.writeText(pitch);
      } catch (err) {
        // Fallback if clipboard API fails
        const textArea = document.createElement("textarea");
        textArea.value = pitch;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      // 2. Build URL
      let telegramUrl = "";
      const id = selectedGc.telegramChatId.trim();
      
      if (id.startsWith('https://t.me/')) {
        telegramUrl = id;
      } else if (id.startsWith('@')) {
        telegramUrl = `https://t.me/${id.slice(1)}`;
      } else if (id.match(/^-?\d+$/)) {
        telegramUrl = `tg://resolve?domain=${id}`;
      } else {
        telegramUrl = id.includes('/') ? `https://t.me/${id.split('/').pop()}` : `https://t.me/${id}`;
      }

      // 3. Open Telegram
      const win = window.open(telegramUrl, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        alert("Telegram link was blocked. Please allow popups or use the Copy button and open Telegram manually.");
      }
      
      setSentMap(prev => ({ ...prev, [pitchIdx]: true }));
      await updateGC(userId, selectedGc.id, { pitchCount: (selectedGc.pitchCount || 0) + 1 });
      setTimeout(() => setSentMap(prev => ({ ...prev, [pitchIdx]: false })), 3000);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to handle pitch.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic text-gray-200">Pitch Arsenal</h2>
          <p className="text-xs text-[#ff5a00] font-mono tracking-widest mt-1">
            DAY {currentDay} • {currentDateString.toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select 
            value={selectedGcId}
            onChange={e => setSelectedGcId(e.target.value)}
            className="bg-[#151515] border border-[#333] px-3 py-2 text-sm rounded outline-none focus:border-[#ff5a00] transition text-white min-w-[200px]"
          >
            <option value="">Select Target GC</option>
            {activeTelegramGcs.map(gc => (
              <option key={gc.id} value={gc.id}>{gc.name} ({gc.platform})</option>
            ))}
          </select>

          <input 
            type="text" 
            placeholder="Add flavor..."
            value={flavor}
            onChange={e => setFlavor(e.target.value)}
            className="bg-[#151515] border border-[#333] px-3 py-2 text-sm rounded outline-none focus:border-[#ff5a00] w-full md:w-32 transition"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <button 
            disabled={loading}
            onClick={handleGenerate}
            className="bg-[#ff5a00] hover:bg-[#ff7a33] text-black px-4 py-2 rounded-tl-lg rounded-br-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50 whitespace-nowrap shadow-[0_0_15px_rgba(255,90,0,0.2)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-start gap-4">
        <div className="bg-blue-500/20 p-2 rounded-lg mt-1">
          <Send className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase italic">Pitching Guide</h3>
          <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
            Personal Mode Active. Clicking 'Launch' will copy the pitch and open the selected GC in Telegram. Paste the pitch manually once Telegram opens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {allPitches.map((pitch, idx) => {
          const pitchId = `pitch-${idx}`;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className="bg-[#151515] border border-[#2a2a2a] p-5 rounded-tl-[20px] rounded-br-[20px] flex gap-4 group hover:border-[#ff5a00]/30 transition relative overflow-hidden"
            >
              {idx < aiPitches.length && (
                  <div className="absolute top-0 right-0 p-1 bg-[#ff5a00] text-black text-[8px] font-bold uppercase rounded-bl-lg">AI Generated</div>
              )}
              <div className="text-[#ff5a00]/50 mt-1">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-gray-200 leading-relaxed font-medium">"{pitch}"</p>
              </div>
              <div className="flex gap-2 h-fit">
                <button 
                  onClick={() => handleSendTelegram(pitch, pitchId)}
                  disabled={sendingId === pitchId}
                  className={`p-2 rounded-tl-lg rounded-br-lg transition flex items-center gap-1 text-[10px] uppercase font-bold ${
                    sentMap[pitchId] 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-[#ff5a00]/10 hover:bg-[#ff5a00]/20 text-[#ff5a00]'
                  } disabled:opacity-50`}
                  title="Copy Pitch and Launch Telegram"
                >
                  {sendingId === pitchId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sentMap[pitchId] ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sentMap[pitchId] ? 'Ready' : 'Launch'}
                </button>
                <button 
                  onClick={() => copyToClipboard(pitch)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-tl-lg rounded-br-lg transition text-gray-400 hover:text-white"
                  title="Copy to Clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
