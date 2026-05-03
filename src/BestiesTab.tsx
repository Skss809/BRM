import React, { useState } from 'react';
import { BestieRecord, GCRecord, addBestie, updateBestie } from './data';
import { Plus, Check, X, Clock, Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './lib/utils';

export function BestiesTab({ userId, besties, gcs }: { userId: string, besties: BestieRecord[], gcs: GCRecord[] }) {
  const [isAdding, setIsAdding] = useState(false);
  
  const [realName, setRealName] = useState('');
  const [contactIdentity, setContactIdentity] = useState('');
  const [status, setStatus] = useState<'Agreed'|'Rejected'|'Pending'>('Pending');
  const [gcId, setGcId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realName || !contactIdentity) return;
    
    // Create unique ID (e.g. BRM-001)
    const count = besties.length + 1;
    const uniqueId = `BRM-${count.toString().padStart(3, '0')}`;
    
    await addBestie(userId, { 
      realName, contactIdentity, status, gcId, uniqueId, rejectionReason
    });
    
    setIsAdding(false);
    setRealName('');
    setContactIdentity('');
    setStatus('Pending');
    setGcId('');
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase italic text-gray-200">Bestie Directory</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-tl-lg rounded-br-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Log Prospect
        </button>
      </div>

      {isAdding && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#151515] border border-[#2a2a2a] p-6 rounded-tl-[20px] rounded-br-[20px] rounded-tr-md rounded-bl-md space-y-4"
          onSubmit={handleAdd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Real Name</label>
              <input type="text" required value={realName} onChange={e => setRealName(e.target.value)} className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Contact (WA/TG/IG)</label>
              <input type="text" required value={contactIdentity} onChange={e => setContactIdentity(e.target.value)} className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition">
                <option value="Pending">Pending</option>
                <option value="Sent Link">Sent link for bestie consent</option>
                <option value="Agreed">Agreed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Source GC (Optional)</label>
              <select value={gcId} onChange={e => setGcId(e.target.value)} className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition">
                <option value="">-- Select GC --</option>
                {gcs.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            
            {status === 'Rejected' && (
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Reason for Rejection</label>
                <input type="text" required={status === 'Rejected'} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="w-full bg-black/50 border border-[#333] rounded p-2 text-white outline-none focus:border-[#ff5a00] transition" />
              </div>
            )}
          </div>
          <button type="submit" className="bg-[#ff5a00] text-black font-bold uppercase tracking-widest px-6 py-2 rounded-tl-lg rounded-br-lg hover:bg-[#ff7a33] transition mt-2">
            Log Prospect
          </button>
        </motion.form>
      )}

      {/* List View */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-tl-[20px] rounded-br-[20px] overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-[#2a2a2a] bg-[#151515] text-xs font-bold uppercase text-gray-400">
          <div className="col-span-2">Identity</div>
          <div className="col-span-1">ID</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        
        <div className="max-h-[600px] overflow-y-auto">
          {besties.map(b => (
            <div key={b.id} className="grid grid-cols-6 gap-4 p-4 border-b border-[#222] items-center hover:bg-white/5 transition">
              <div className="col-span-2">
                <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{b.realName}</p>
                <p className="text-xs text-gray-500 font-mono truncate">{b.contactIdentity}</p>
              </div>
              <div className="col-span-1">
                <span className="text-xs font-mono text-[#ff5a00] py-1 px-2 bg-black/30 border border-[#333] rounded">
                  {b.uniqueId}
                </span>
              </div>
              <div className="col-span-1 flex flex-col gap-1 items-start">
                <span className={cn(
                  "text-xs font-bold uppercase px-2 py-1 rounded inline-block",
                  b.status === 'Agreed' ? 'bg-green-500/20 text-green-400' :
                  b.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                  b.status === 'Sent Link' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                )}>
                  {b.status}
                </span>
                {b.status === 'Rejected' && b.rejectionReason && (
                   <span className="text-[10px] text-gray-500 italic max-w-[120px] truncate">
                     "{b.rejectionReason}"
                   </span>
                )}
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                {b.status !== 'Sent Link' && (
                  <button onClick={() => updateBestie(userId, b.id, { status: 'Sent Link' })} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-tl-lg rounded-br-lg transition" title="Mark Sent Link">
                    <Clock className="w-4 h-4" />
                  </button>
                )}
                {b.status !== 'Agreed' && (
                  <button onClick={() => updateBestie(userId, b.id, { status: 'Agreed' })} className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-tl-lg rounded-br-lg transition" title="Mark Agreed">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {b.status !== 'Rejected' && (
                  <button onClick={() => updateBestie(userId, b.id, { status: 'Rejected', rejectionReason: 'Unknown reason' })} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-tl-lg rounded-br-lg transition" title="Mark Rejected">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {besties.length === 0 && (
            <div className="p-8 text-center text-gray-500 italic">No prospects found. Log one above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
