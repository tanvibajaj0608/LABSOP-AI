import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { SOP, Revision } from '../types';
import { ArrowLeft, Edit3, History, Download, Share2, Loader2, Save, X, CheckCircle2, AlertTriangle, FileText, ChevronDown, ChevronUp, ShieldCheck, User, MoreVertical, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import FeedbackModal from '../components/FeedbackModal';

export default function SOPDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sop, setSop] = useState<SOP | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [currentRevision, setCurrentRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [changelog, setChangelog] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Check for edit query param
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }

    const sopRef = doc(db, 'sops', id);
    const unsubscribeSop = onSnapshot(sopRef, (docSnap) => {
      if (docSnap.exists()) {
        setSop({ id: docSnap.id, ...docSnap.data() } as SOP);
      } else {
        navigate('/');
      }
    });

    const revQuery = query(collection(db, 'sops', id, 'revisions'), orderBy('version', 'desc'));
    const unsubscribeRevisions = onSnapshot(revQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Revision));
      setRevisions(data);
      if (data.length > 0) {
        setCurrentRevision(data[0]);
        setEditContent(data[0].content);
        
        // Trigger feedback if requested by CreateSOP
        const trigger = localStorage.getItem('trigger_feedback');
        if (trigger === 'true') {
          localStorage.removeItem('trigger_feedback');
          triggerFeedback();
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeSop();
      unsubscribeRevisions();
    };
  }, [id, navigate]);

  const triggerFeedback = () => {
    const hasGivenFeedback = localStorage.getItem('has_given_feedback');
    if (!hasGivenFeedback) {
      setTimeout(() => {
        setShowFeedback(true);
      }, 1000);
    }
  };

  const handleExportPDF = async () => {
    if (!sop) return;
    setIsExporting(true);
    setShowExportOptions(false);
    
    try {
      const docElement = document.getElementById('sop-document');
      if (!docElement) return;

      const canvas = await html2canvas(docElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${sop.title.replace(/\s+/g, '_')}_v${sop.currentVersion}.pdf`);
      triggerFeedback();
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (!sop || !currentRevision) return;
    setIsExporting(true);
    setShowExportOptions(false);

    try {
      const docElement = document.getElementById('sop-document');
      if (!docElement) return;

      // Capture the actual rendered HTML from the DOM
      const renderedHtml = docElement.innerHTML;

      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${sop.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Playfair+Display:wght@700&family=JetBrains+Mono&display=swap');
          body { font-family: 'Times New Roman', serif; line-height: 1.5; padding: 40px; color: #0f172a; }
          .border-b-2 { border-bottom: 2px solid #0f172a; }
          .pb-4 { padding-bottom: 16px; }
          .mb-10 { margin-bottom: 40px; }
          .flex { display: table; width: 100%; }
          .justify-between { display: table-cell; }
          .items-end { vertical-align: bottom; }
          .text-2xl { font-size: 20pt; font-family: 'Playfair Display', serif; font-weight: bold; text-transform: uppercase; }
          .text-right { text-align: right; }
          .text-slate-400 { color: #94a3b8; }
          .text-slate-900 { color: #0f172a; }
          .font-mono { font-family: 'Courier New', monospace; font-size: 9pt; }
          .uppercase { text-transform: uppercase; }
          
          /* Markdown body styling inside Word */
          .markdown-body { margin-top: 20px; }
          .markdown-body h1 { font-size: 18pt; margin-top: 24pt; margin-bottom: 12pt; border-bottom: 1px solid #e2e8f0; }
          .markdown-body h2 { font-size: 16pt; margin-top: 20pt; margin-bottom: 10pt; }
          .markdown-body h3 { font-size: 14pt; margin-top: 16pt; margin-bottom: 8pt; }
          .markdown-body p { margin-bottom: 10pt; font-size: 11pt; }
          .markdown-body ul, .markdown-body ol { margin-bottom: 10pt; padding-left: 20pt; }
          .markdown-body li { margin-bottom: 4pt; }
          .markdown-body table { border-collapse: collapse; width: 100%; margin: 16pt 0; border: 1px solid #e2e8f0; }
          .markdown-body th, .markdown-body td { border: 1px solid #e2e8f0; padding: 8pt; text-align: left; vertical-align: top; }
          .markdown-body th { background-color: #f8f9fa; font-weight: bold; }
          .markdown-body blockquote { border-left: 4pt solid #e2e8f0; padding-left: 12pt; color: #64748b; font-style: italic; margin-left: 0; }
          code { background-color: #f1f5f9; padding: 2pt 4pt; border-radius: 4pt; font-family: 'Courier New', monospace; font-size: 10pt; }
        </style>
        </head><body>
      `;
      
      const footer = "</body></html>";
      
      const source = header + renderedHtml + footer;
      const blob = new Blob(['\ufeff', source], {
        type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sop.title.replace(/\s+/g, '_')}_v${sop.currentVersion}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerFeedback();
    } catch (error) {
      console.error('Word Export failed:', error);
      alert('Failed to generate Word document');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveRevision = async () => {
    if (!sop || !id || !user) return;
    
    setSaving(true);
    try {
      const nextVersion = sop.currentVersion + 1;
      
      // Add new revision
      await addDoc(collection(db, 'sops', id, 'revisions'), {
        sopId: id,
        version: nextVersion,
        content: editContent,
        changelog: changelog || `Manual update to version ${nextVersion}`,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      // Update main SOP metadata
      await updateDoc(doc(db, 'sops', id), {
        currentVersion: nextVersion,
        updatedAt: serverTimestamp(),
        status: 'draft' // Mark as draft until approved if workflow exists
      });

      setIsEditing(false);
      setChangelog('');
    } catch (error) {
      console.error(error);
      alert("Failed to save revision");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!sop || !id) return;
    await updateDoc(doc(db, 'sops', id), {
      status: 'active',
      updatedAt: serverTimestamp()
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!sop || !currentRevision) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={16} />
            Library
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{sop.title}</h1>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                sop.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {sop.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sop.guidelines.map(g => (
                <span key={g} className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                  {g}
                </span>
              ))}
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded">
                VERSION v{sop.currentVersion}.0
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(!isEditing && (isAdmin || sop.createdBy === user?.uid)) && (
            <>
              {sop.status === 'draft' && (
                <button 
                  onClick={handleApprove}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm"
                >
                  <CheckCircle2 size={18} />
                  Authorize Release
                </button>
              )}
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-sm"
              >
                <Edit3 size={18} />
                Generate Revision
              </button>
            </>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              disabled={isExporting}
              className="p-2.5 text-slate-400 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors flex items-center gap-2"
              title="Export Document"
            >
              {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
            <AnimatePresence>
              {showExportOptions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-[60] overflow-hidden"
                >
                  <button 
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <FileDown size={16} className="text-red-500" />
                    Export as PDF
                  </button>
                  <button 
                    onClick={handleExportWord}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <FileText size={16} className="text-blue-500" />
                    Export as Word
                  </button>
                  <button 
                    onClick={() => { setShowExportOptions(false); window.print(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Download size={16} className="text-slate-500" />
                    Print Document
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative" id="sop-document">
            <div className="p-12 overflow-y-auto">
              <div className="border-b-2 border-slate-900 pb-4 mb-10 flex justify-between items-end">
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif font-bold uppercase tracking-tight text-slate-900">{sop.title} : Standard Operating Procedure</h2>
                  <p className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">Registry ID: {sop.id.toUpperCase()}</p>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-400 leading-tight">
                  <p>EFF. DATE: {format(sop.createdAt?.toDate() || new Date(), 'dd MMM yyyy').toUpperCase()}</p>
                  <p>REVISED: {sop.updatedAt ? format(sop.updatedAt?.toDate(), 'dd MMM yyyy').toUpperCase() : 'N/A'}</p>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technical Content Editor</label>
                     <textarea 
                        rows={25}
                        className="w-full p-6 font-mono text-sm border border-slate-100 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Changelog Documentation *</label>
                     <input 
                        type="text"
                        placeholder="Detail the technical changes in this revision..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={changelog}
                        onChange={(e) => setChangelog(e.target.value)}
                     />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 border border-slate-200 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                    >
                      Discard Edits
                    </button>
                    <button 
                      onClick={handleSaveRevision}
                      disabled={saving || !changelog}
                      className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest"
                    >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Commit Revision v{sop.currentVersion + 1}.0
                    </button>
                  </div>
                </div>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown>{currentRevision.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="w-full p-4 flex items-center justify-between bg-slate-50 border-b border-slate-200"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <History size={16} />
                Audit Trail
              </div>
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence initial={false}>
              {(showHistory || window.innerWidth > 1024) && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-slate-100">
                    {revisions.map((rev) => (
                      <div 
                        key={rev.id} 
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${rev.id === currentRevision.id ? 'bg-blue-50/50 border-l-2 border-blue-600' : ''}`}
                        onClick={() => setCurrentRevision(rev)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${rev.id === currentRevision.id ? 'text-blue-600' : 'text-slate-900'}`}>
                            REV v{rev.version}.0
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold uppercase">
                            {format(rev.createdAt?.toDate() || new Date(), 'dd MMM HH:mm')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 italic mb-2 tracking-tight">"{rev.changelog}"</p>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          <User size={10} />
                          {rev.createdBy === user?.uid ? 'System Admin' : 'Investigator'}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <ShieldCheck size={80} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Compliance Status</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-blue-400" />
                </div>
                <span>Regulatory Header Compliant</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-blue-400" />
                </div>
                <span>Immutable Version History</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-blue-400" />
                </div>
                <span>Authorized Digital Signature</span>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-[10px] font-mono text-slate-500 leading-tight">
                SYSTEM VER: 4.0.2-STABLE<br/>
                INSTANCE: ACCREDITED_UNIT_01
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
      />
    </div>
  );
}
