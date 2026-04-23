import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../App';
import { generateSOP } from '../lib/gemini';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Upload, Info, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const GUIDELINE_OPTIONS = [
  'ISO 15189',
  'CAP (College of American Pathologists)',
  'NABL (India)',
  'EHR (Electronic Health Record)',
  'Pharma (GxP/GLP)',
  'CLIA',
  'ISO 9001'
];

export default function CreateSOP() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [selectedGuidelines, setSelectedGuidelines] = useState<string[]>([]);
  const [guideText, setGuideText] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [version, setVersion] = useState('1');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setGuideText(prev => prev ? prev + '\n\n' + text : text);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setGuideText(prev => prev ? prev + '\n\n' + result.value : result.value);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        setGuideText(prev => prev ? prev + '\n\n' + fullText : fullText);
      } else {
        throw new Error("Unsupported file format. Please upload .txt, .docx, or .pdf files.");
      }
    } catch (err: any) {
      console.error("File processing error:", err);
      setError(err.message || "Failed to process document.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGuideline = (g: string) => {
    setSelectedGuidelines(prev => 
      prev.includes(g) ? prev.filter(i => i !== g) : [...prev, g]
    );
  };

  const handleGenerate = async () => {
    if (!title || !guideText || selectedGuidelines.length === 0) {
      setError("Please fill in all required fields including guidelines.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const generatedContent = await generateSOP({
        title,
        guideText,
        guidelines: selectedGuidelines,
        additionalDetails,
        version: parseInt(version)
      });

      // Save to Firestore
      const sopRef = await addDoc(collection(db, 'sops'), {
        title,
        currentVersion: parseInt(version),
        guidelines: selectedGuidelines,
        createdBy: user?.uid,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Save the first revision
      await addDoc(collection(db, 'sops', sopRef.id, 'revisions'), {
        sopId: sopRef.id,
        version: parseInt(version),
        content: generatedContent,
        changelog: 'Initial generation',
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      });

      const hasGivenFeedback = localStorage.getItem('has_given_feedback');
      if (!hasGivenFeedback) {
        localStorage.setItem('trigger_feedback', 'true');
      }

      navigate(`/sop/${sopRef.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to generate SOP. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 transition-colors group text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Dashboard
      </button>

      <div className="flex flex-col lg:flex-row gap-6 h-full items-stretch">
        {/* Left Side: Resources & Meta */}
        <section className="w-full lg:w-[380px] flex flex-col gap-5 shrink-0">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Step 1: Resource Capture</h2>
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 bg-slate-50 cursor-pointer transition-all block group">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
              <p className="text-sm text-slate-600 font-bold">Import Guide or Protocol</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">TXT, DOCX, or PDF</p>
              <input type="file" accept=".txt,.md,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Step 2: Meta Configuration</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">SOP Document Title</label>
                <input 
                  type="text"
                  placeholder="e.g., Blood Analysis Protocol"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Initial Ver.</label>
                  <input 
                    type="text"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dept Code</label>
                  <input 
                    type="text"
                    placeholder="HEM-01"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Regulatory Frameworks</label>
                <div className="flex flex-wrap gap-2">
                  {GUIDELINE_OPTIONS.map(g => (
                    <button
                      key={g}
                      onClick={() => handleToggleGuideline(g)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        selectedGuidelines.includes(g)
                          ? 'bg-blue-50 border-blue-100 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-blue-200'
                      }`}
                    >
                      {g.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading || !title || !guideText || selectedGuidelines.length === 0}
                className={`mt-4 w-full p-3 rounded-lg text-white font-bold text-center text-xs uppercase tracking-widest transition-all ${
                  loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={14} />
                    Synthesizing...
                  </span>
                ) : 'Execute Synthesis'}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Side: Procedure Content Editor */}
        <section className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step 3: Source Methodology</h2>
            <span className="text-[10px] text-slate-300 font-mono">MD PARSER ACTIVE</span>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            <textarea 
              rows={20}
              placeholder="Inject reference material, manual steps, or kit instructions here..."
              className="w-full h-full p-6 text-sm border border-slate-100 rounded-lg bg-slate-50 focus:outline-none font-mono text-slate-700 resize-none"
              value={guideText}
              onChange={(e) => setGuideText(e.target.value)}
            />
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono italic">
              <Sparkles size={12} className="text-blue-400" />
              Intelligence will extract regulatory invariants and create a structured SOP document.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
