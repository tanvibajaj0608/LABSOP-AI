import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { FlaskConical, Github } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center"
      >
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <FlaskConical className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          LabSOP<span className="text-blue-600">AI</span>
        </h1>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium">
          Automated protocol synthesis and regulatory compliance management for accredited laboratories.
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] text-sm shadow-sm group"
        >
          <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0112 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"
            />
            <path
              fill="#34A853"
              d="M16.04 18.013c-1.09.696-2.47 1.1-4.04 1.1-2.955 0-5.448-1.89-6.35-4.507L1.61 17.722C3.646 21.61 7.42 24 12 24c3.18 0 6.077-1.127 8.545-3.327l-4.505-3.66z"
            />
            <path
              fill="#4285F4"
              d="M19.835 18.907A9.913 9.913 0 0024 12c0-4.064-2.435-7.563-6-9.144l-3.751 3.054c1.1.582 1.96 1.487 2.455 2.582 3.033 1.346 5.296 4.31 5.296 7.764 0 2.227-.88 4.31-2.296 5.89l4.505 3.661z"
            />
            <path
              fill="#FBBC05"
              d="M5.277 14.268A7.12 7.12 0 014.909 12c0-.782.136-1.536.382-2.235L1.265 6.65A11.772 11.772 0 000 12c0 1.927.464 3.745 1.291 5.355l3.986-3.087z"
            />
          </svg>
          Sign in with Google Account
        </button>
        <p className="mt-4 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
          Laboratory credentials via Gmail or Google Workspace
        </p>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 opacity-40 grayscale">
             <span className="text-[10px] font-black tracking-tighter">ISO 15189</span>
             <span className="text-[10px] font-black tracking-tighter">CAP ACCREDITED</span>
             <span className="text-[10px] font-black tracking-tighter">NABL</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
