import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { HelpCircle, Send, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Support() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'support'), {
        userId: user.uid,
        userEmail: user.email,
        subject: subject || 'General Inquiry',
        message,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setSuccess(true);
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error(error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-5 h-full">
          {/* Left Sidebar */}
          <div className="md:col-span-2 bg-slate-900 p-8 text-white flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Technical Support</h1>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Facing issues with document generation or regulatory framework compliance? Our lead administrator is ready to assist.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <MessageSquare size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Response Time</h3>
                    <p className="text-sm">Typically within 24 laboratory hours.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 mt-8">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                System Administrator Account:<br/>
                {import.meta.env.VITE_ADMIN_EMAIL || 'tanvibajaj0608@gmail.com'}
              </p>
            </div>
          </div>

          {/* Right Form */}
          <div className="md:col-span-3 p-8">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
              >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Message Transmitted</h2>
                <p className="text-slate-500 text-sm mb-8">Your support ticket has been registered in the administrative queue.</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Send Another
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Inquiry Subject</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g., ISO 15189 Parsing Error"
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detailed Message</label>
                  <textarea 
                    rows={6}
                    required
                    placeholder="Describe the issue you are facing in detail..."
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Transmit Support Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
