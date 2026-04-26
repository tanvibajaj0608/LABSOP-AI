import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { SOP } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Filter, ChevronRight, Clock, User, ShieldCheck, Loader2, History as HistoryIcon, CheckCircle2, Edit3, Trash2, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let q = query(collection(db, 'sops'), orderBy('createdAt', 'desc'));
    
    if (!isAdmin) {
      q = query(collection(db, 'sops'), where('createdBy', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SOP));
      setSops(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    
    setDeletingId(id);
    try {
      console.log(`Executing direct purge for record: ${id}`);
      await deleteDoc(doc(db, 'sops', id));
      console.log("Purge complete.");
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error("Purge Registry Failure:", error);
      let message = "Purge execution failed.";
      if (error.code === 'permission-denied') {
        message = "Access Denied: You do not have administrative authority to purge this registry record.";
      }
      alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSops = sops.filter(sop => 
    sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sop.guidelines.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scientist Dashboard</h1>
          <p className="text-slate-500 text-sm">Regulatory documentation and laboratory protocol management.</p>
        </div>
        <Link 
          to="/create"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus size={20} />
          Create SOP
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center bg-slate-50/50">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Filter by title, reference or standard..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all shrink-0">
            <Filter size={14} />
            Standards
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="lab-table">
            <thead>
              <tr>
                <th className="w-1/3">Standard Operating Procedure</th>
                <th>Ver.</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Registry</th>
                <th className="hidden lg:table-cell">Last Revised</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <span className="text-xs uppercase font-bold tracking-widest">Scanning Repository...</span>
                  </td>
                </tr>
              ) : filteredSops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24 text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 uppercase text-xs tracking-widest">No Documents Found</p>
                        <p className="text-xs">Initial standard generation required for this account.</p>
                      </div>
                      <Link to="/create" className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-1">
                        Begin Generation <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSops.map((sop) => (
                  <tr key={sop.id} className="lab-row">
                    <td>
                      <div className="space-y-1.5">
                        <div className="font-bold text-slate-800">{sop.title}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {sop.guidelines.map(g => (
                            <span key={g} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-md uppercase tracking-wider border border-blue-100">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] text-slate-500">v{sop.currentVersion}.0</span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        sop.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 
                        sop.status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          sop.status === 'active' ? 'bg-green-500' : 
                          sop.status === 'draft' ? 'bg-amber-500' : 
                          'bg-slate-400'
                        }`}></span>
                        {sop.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                         <span className="opacity-50">#</span>{sop.id.slice(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell text-[11px] text-slate-500 font-mono">
                      {format(sop.updatedAt?.toDate() || sop.createdAt?.toDate() || new Date(), 'dd MMM yyyy').toUpperCase()}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <AnimatePresence mode="wait">
                          {confirmDeleteId === sop.id ? (
                            <motion.div 
                              key="confirm"
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex items-center gap-2 bg-red-50 p-1 pr-2 rounded-lg border border-red-100"
                            >
                              <span className="text-[9px] font-bold text-red-600 uppercase px-2">Purge?</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(sop.id);
                                }}
                                disabled={deletingId === sop.id}
                                className="bg-red-600 text-white p-1 rounded-md hover:bg-red-700 transition-colors"
                              >
                                {deletingId === sop.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                disabled={deletingId === sop.id}
                                className="bg-slate-200 text-slate-600 p-1 rounded-md hover:bg-slate-300 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="actions"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-1"
                            >
                              <Link 
                                to={`/sop/${sop.id}?edit=true`}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit Document"
                              >
                                <Edit3 size={18} />
                              </Link>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setConfirmDeleteId(sop.id);
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Purge Document"
                              >
                                <Trash2 size={18} />
                              </button>
                              <Link 
                                to={`/sop/${sop.id}`}
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                                title="View Document"
                              >
                                <ChevronRight size={18} />
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Total Inventory</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{sops.length}</p>
            <FileText className="text-slate-100" size={32} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Released Standards</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{sops.filter(s => s.status === 'active').length}</p>
            <CheckCircle2 className="text-slate-100" size={32} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Revision Count</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{sops.reduce((acc, curr) => acc + curr.currentVersion, 0)}</p>
            <HistoryIcon className="text-slate-100" size={32} />
          </div>
        </div>
      </div>
    </div>
  );
}
