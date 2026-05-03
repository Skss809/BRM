import React, { useState, useRef } from 'react';
import { GCRecord, addGC, updateGC } from './data';
import { Plus, Users, MessageSquare, Image as ImageIcon, Loader2, X, MoreVertical, Edit2, Settings, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractGCNamesFromImage } from './ai';

export function GCTab({ userId, gcs }: { userId: string, gcs: GCRecord[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [platform, setPlatform] = useState<'Telegram'|'WhatsApp'|'Discord'>('Telegram');
  const [isExtracting, setIsExtracting] = useState(false);
  
  const [viewMode, setViewMode] = useState<'Active'|'Past'>('Active');
  const [settingsGcId, setSettingsGcId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (batchNames.length > 0) {
        const validNames = batchNames.filter(n => n.trim() !== '');
        for (const bn of validNames) {
          await addGC(userId, { name: bn.trim(), platform, status: 'Active' });
        }
        setBatchNames([]);
        setIsAdding(false);
      } else {
        if (!name.trim()) return;
        await addGC(userId, { name: name.trim(), platform, status: 'Active' });
        setName('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const extractedNames = await extractGCNamesFromImage(file);
      if (extractedNames && extractedNames.length > 0) {
        setBatchNames(extractedNames);
        setName(''); // Clear single name if there was one
      } else {
        alert("Could not extract GC names from the image. Please try again or enter manually.");
      }
    } catch (error) {
      console.error(error);
      alert("Error extracting text from image.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const activeGcs = gcs.filter(gc => !gc.status || gc.status === 'Active');
  const pastGcs = gcs.filter(gc => gc.status === 'Left' || gc.status === 'Banned');
  
  const displayedGcs = viewMode === 'Active' ? activeGcs : pastGcs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase italic text-gray-200">Group Chats</h2>
          <div className="flex bg-[#1a1a1a] p-1 rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm border border-[#333]">
            <button 
              onClick={() => setViewMode('Active')}
              className={`px-3 py-1 text-xs font-bold uppercase rounded-tl-md rounded-br-md transition ${viewMode === 'Active' ? 'bg-[#ff5a00] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setViewMode('Past')}
              className={`px-3 py-1 text-xs font-bold uppercase rounded-tl-md rounded-br-md transition ${viewMode === 'Past' ? 'bg-[#ff5a00] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Past GCs
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-tl-lg rounded-br-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add GC
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#151515] border border-[#2a2a2a] p-6 rounded-tl-[20px] rounded-br-[20px] rounded-tr-md rounded-bl-md space-y-4 overflow-hidden"
            onSubmit={handleAdd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {batchNames.length > 0 ? (
                <div className="md:col-span-1 space-y-2 max-h-64 overflow-y-auto pr-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase text-[#ff5a00]">Review Extracted Names</label>
                    <button type="button" onClick={() => setBatchNames([])} className="text-xs text-gray-500 hover:text-white uppercase font-bold tracking-wider">Clear</button>
                  </div>
                  {batchNames.map((bn, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text"
                        value={bn} 
                        onChange={e => {
                          const newNames = [...batchNames];
                          newNames[idx] = e.target.value;
                          setBatchNames(newNames);
                        }}
                        className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition"
                      />
                      <button type="button" onClick={() => {
                          setBatchNames(batchNames.filter((_, i) => i !== idx));
                      }} className="bg-red-500/10 text-red-500 p-2 rounded hover:bg-red-500/20 transition">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">GC Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition" 
                      placeholder="E.g. Anime Weebs"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExtracting}
                      className="bg-[#333] hover:bg-[#444] text-white p-2 rounded transition flex items-center justify-center min-w-[40px]"
                      title="Extract from Screenshot"
                    >
                      {isExtracting ? <Loader2 className="w-5 h-5 animate-spin text-[#ff5a00]" /> : <ImageIcon className="w-5 h-5" />}
                    </button>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Platform</label>
                <select 
                  value={platform}
                  onChange={e => setPlatform(e.target.value as any)}
                  className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition"
                >
                  <option value="Telegram">Telegram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Discord">Discord</option>
                </select>
              </div>
            </div>
            <button type="submit" className="bg-[#ff5a00] text-black font-bold uppercase tracking-widest px-6 py-2 rounded-tl-lg rounded-br-lg hover:bg-[#ff7a33] transition mt-4 w-full md:w-auto">
              {batchNames.length > 0 ? `Save ${batchNames.length} GCs` : 'Save GC'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedGcs.map(gc => (
          <div key={gc.id} className="bg-[#151515] border border-[#2a2a2a] p-4 rounded-tl-[15px] rounded-br-[15px] flex flex-col justify-between relative group hover:border-[#444] transition-colors">
            {settingsGcId === gc.id ? (
              <div className="flex flex-col h-full z-10 bg-[#151515]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-[#ff5a00] uppercase">Update Data</h3>
                  <button onClick={() => setSettingsGcId(null)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">Joined</label>
                      <input 
                        type="number" 
                        value={gc.joinedCount} 
                        onChange={(e) => updateGC(userId, gc.id, { joinedCount: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-[#333] p-1 text-sm rounded text-white" 
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-[10px] uppercase text-gray-500 mb-1">Pitches</label>
                      <input 
                        type="number" 
                        value={gc.pitchCount} 
                        onChange={(e) => updateGC(userId, gc.id, { pitchCount: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/50 border border-[#333] p-1 text-sm rounded text-white" 
                      />
                    </div>
                  </div>
                  
                  {(!gc.status || gc.status === 'Active') && (
                    <div className="pt-2 border-t border-[#2a2a2a] space-y-2">
                      <button 
                        onClick={() => {
                          updateGC(userId, gc.id, { status: 'Left' });
                          setSettingsGcId(null);
                        }}
                        className="w-full py-1 text-xs font-bold uppercase bg-white/5 hover:bg-white/10 text-white rounded transition"
                      >
                        Left by user
                      </button>
                      <button 
                        onClick={() => {
                          updateGC(userId, gc.id, { status: 'Banned' });
                          setSettingsGcId(null);
                        }}
                        className="w-full py-1 text-xs font-bold uppercase bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition"
                      >
                        Banned by Admin
                      </button>
                    </div>
                  )}

                  {gc.status && gc.status !== 'Active' && (
                    <div className="pt-2 border-t border-[#2a2a2a]">
                      <button 
                        onClick={() => {
                          updateGC(userId, gc.id, { status: 'Active' });
                          setSettingsGcId(null);
                        }}
                        className="w-full py-1 text-xs font-bold uppercase bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded transition"
                      >
                        Restore to Active
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg truncate pr-8" title={gc.name}>{gc.name}</h3>
                    <div className="flex items-center gap-2">
                      {gc.status && gc.status !== 'Active' && (
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${gc.status === 'Banned' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {gc.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-black/50 border border-[#333] rounded text-[#ff5a00] inline-block">
                    {gc.platform}
                  </span>
                  
                  <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> 
                      <span>Joined: {gc.joinedCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>Pitches: {gc.pitchCount}</span>
                    </div>
                  </div>
                </div>
                
                {(!gc.status || gc.status === 'Active') && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex justify-between">
                    <button 
                      onClick={() => updateGC(userId, gc.id, { joinedCount: gc.joinedCount + 1 })}
                      className="text-xs uppercase w-full font-bold text-gray-400 hover:text-white py-1"
                    >
                      + Joined
                    </button>
                    <button 
                      onClick={() => updateGC(userId, gc.id, { pitchCount: gc.pitchCount + 1 })}
                      className="text-xs uppercase w-full font-bold text-[#ff5a00] hover:text-[#ff7a33] border-l border-[#2a2a2a] py-1"
                    >
                      + Pitch
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={() => setSettingsGcId(gc.id)}
                  className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white transition rounded opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
        
        {displayedGcs.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-gray-500 italic">
            {viewMode === 'Active' ? 'No active GCs tracked yet. Add one to start your mission.' : 'No past GCs.'}
          </div>
        )}
      </div>
    </div>
  );
}
