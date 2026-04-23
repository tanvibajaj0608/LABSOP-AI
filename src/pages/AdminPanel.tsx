import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { SOP, UserProfile } from '../types';
import { ShieldAlert, Users, FileText, Activity, Search, Trash2, Mail, ExternalLink, ShieldCheck, CheckCircle2, User, Lock, Edit3, Loader2, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPanel() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'support'>('overview');
  const [feedback, setFeedback] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all users
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    });

    // Fetch all SOPs
    const unsubSops = onSnapshot(query(collection(db, 'sops'), orderBy('createdAt', 'desc')), (snap) => {
      setSops(snap.docs.map(d => ({ id: d.id, ...d.data() } as SOP)));
    });

    // Fetch Feedback
    const unsubFeedback = onSnapshot(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')), (snap) => {
      setFeedback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Support
    const unsubSupport = onSnapshot(query(collection(db, 'support'), orderBy('createdAt', 'desc')), (snap) => {
      setSupportTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    setLoading(false);

    return () => {
      unsubUsers();
      unsubSops();
      unsubFeedback();
      unsubSupport();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Administrative Intelligence</h1>
          <p className="text-slate-500 text-sm">Registry oversight and personnel authorization controls.</p>
        </div>
        
        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Registry
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'feedback' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Insights
          </button>
          <button 
            onClick={() => setActiveTab('support')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'support' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Support
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Total Personnel</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-slate-900">{users.length}</p>
                <Users className="text-slate-100" size={32} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Master Registry</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-slate-900">{sops.length}</p>
                <ShieldAlert className="text-slate-100" size={32} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Authorized Stds</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-green-600">{sops.filter(s => s.status === 'active').length}</p>
                <ShieldCheck className="text-green-50" size={32} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Pending Review</h3>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-amber-600">{sops.filter(s => s.status === 'draft').length}</p>
                <Activity className="text-amber-50" size={32} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel Authorization List</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Identity</th>
                      <th>Designation</th>
                      <th className="text-right">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className="lab-row">
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{u.displayName}</span>
                            <span className="text-[10px] text-slate-400 font-mono italic">{u.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {u.organization || 'Research Investigator'}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            u.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Registry Audit</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Protocol Title</th>
                      <th>Framework</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sops.map((s) => (
                      <tr key={s.id} className="lab-row">
                        <td>
                            <span className="font-bold text-slate-800 text-sm line-clamp-1">{s.title}</span>
                        </td>
                        <td className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {s.guidelines[0]}
                        </td>
                        <td className="text-right">
                           <span className={`text-[10px] font-bold uppercase tracking-widest ${
                             s.status === 'active' ? 'text-green-600' : 'text-amber-500'
                           }`}>
                             {s.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedback.map((f) => (
            <div key={f.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <CheckCircle2 
                        key={star} 
                        size={14} 
                        className={star <= f.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-100'} 
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {f.createdAt?.toDate ? format(f.createdAt.toDate(), 'dd MMM HH:mm') : 'Recently'}
                  </span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">User Experience</h4>
                    <p className="text-sm text-slate-700 leading-relaxed italic">"{f.generalFeedback || 'No commentary provided.'}"</p>
                  </div>
                  {f.issuesFeedback && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                         <ShieldAlert size={10} /> Technical Exception
                      </h4>
                      <p className="text-xs text-red-700 leading-relaxed italic">"{f.issuesFeedback}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User size={12} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{f.userEmail}</span>
              </div>
            </div>
          ))}
          {feedback.length === 0 && <p className="col-span-full text-center py-12 text-slate-400 italic">No user evaluations found in registry.</p>}
        </div>
      )}

      {activeTab === 'support' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="lab-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Inquiry Content</th>
                <th>Authorized User</th>
                <th className="text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {supportTickets.map((t) => (
                <tr key={t.id} className="lab-row">
                  <td className="w-1/4">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{t.subject}</span>
                  </td>
                  <td>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 italic">"{t.message}"</p>
                  </td>
                  <td>
                    <span className="text-[10px] font-mono text-slate-400">{t.userEmail}</span>
                  </td>
                  <td className="text-right">
                    <span className="text-[10px] font-mono text-slate-400">
                      {t.createdAt?.toDate ? format(t.createdAt.toDate(), 'dd MMM HH:mm') : 'Recently'}
                    </span>
                  </td>
                </tr>
              ))}
              {supportTickets.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 italic">No active support tickets found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
