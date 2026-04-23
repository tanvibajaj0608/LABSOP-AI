import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [issuesFeedback, setIssuesFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user.uid,
        userEmail: user.email,
        rating,
        generalFeedback,
        issuesFeedback,
        createdAt: serverTimestamp()
      });
      
      localStorage.setItem('has_given_feedback', 'true');
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert("Failed to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto w-screen h-screen">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl relative z-10 overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Protocol Recorded</h2>
              <p className="text-slate-500">Thank you for your scientific contribution to improving LabSOP AI.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Performance Evaluation</h2>
                <p className="text-slate-500 text-sm mt-1">Grade your experience with the automated synthesis process.</p>
              </div>

              <div className="flex items-center justify-center gap-2 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-all hover:scale-110 active:scale-95"
                  >
                    <Star 
                      size={40} 
                      className={`${
                        (hoverRating || rating) >= star 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-slate-200'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">General User Experience</label>
                  <textarea 
                    placeholder="How was the overall document quality and interface?"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    value={generalFeedback}
                    onChange={(e) => setGeneralFeedback(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Technical Exceptions or Issues</label>
                  <textarea 
                    placeholder="Did you encounter any errors or regulatory inaccuracies?"
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    value={issuesFeedback}
                    onChange={(e) => setIssuesFeedback(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || rating === 0}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Submit Evaluation
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
