import React, { useState, useMemo } from 'react';
import { generatePitch } from './ai';
import { Sparkles, Loader2, Copy, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export function PitchesTab({ currentDay }: { currentDay: number }) {
  const [aiPitches, setAiPitches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [flavor, setFlavor] = useState('');

  const currentDateString = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic text-gray-200">Pitch Arsenal</h2>
          <p className="text-xs text-[#ff5a00] font-mono tracking-widest mt-1">
            DAY {currentDay} • {currentDateString.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Add flavor (e.g. Sarcastic, Anime)"
            value={flavor}
            onChange={e => setFlavor(e.target.value)}
            className="bg-[#151515] border border-[#333] px-3 py-2 text-sm rounded outline-none focus:border-[#ff5a00] w-full md:w-48 transition"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <button 
            disabled={loading}
            onClick={handleGenerate}
            className="bg-[#ff5a00] hover:bg-[#ff7a33] text-black px-4 py-2 rounded-tl-lg rounded-br-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50 whitespace-nowrap shadow-[0_0_15px_rgba(255,90,0,0.2)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate AI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {allPitches.map((pitch, idx) => (
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
            <div>
              <button 
                onClick={() => copyToClipboard(pitch)}
                className="opacity-0 group-hover:opacity-100 p-2 bg-white/5 hover:bg-white/10 rounded-tl-lg rounded-br-lg transition text-gray-400 hover:text-white"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
