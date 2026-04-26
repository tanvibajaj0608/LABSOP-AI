import { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, SOP } from './types';
import { FlaskConical, History, Plus, Settings, User as UserIcon, LogOut, Loader2, BookOpen, ChevronRight, LayoutDashboard, ShieldCheck, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Dashboard from './pages/Dashboard';
import CreateSOP from './pages/CreateSOP';
import SOPDetail from './pages/SOPDetail';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Support from './pages/Support';

// Context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, isAdmin: false });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          // Lazy migration for existing users
          if (data.dailySopCount === undefined) {
            const updatedProfile = { ...data, dailySopCount: 0, lastSopReset: new Date() };
            await setDoc(doc(db, 'users', u.uid), updatedProfile);
            setProfile(updatedProfile);
          } else {
            setProfile(data);
          }
        } else {
          // Create default profile for new user
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || 'Lab Scientist',
            role: 'scientist', // Default role
            createdAt: new Date(),
            dailySopCount: 0,
            lastSopReset: new Date()
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const isAdmin = user?.email === (import.meta.env.VITE_ADMIN_EMAIL || 'tanvibajaj0608@gmail.com');

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin }}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
          {user && <Header isAdmin={isAdmin} profile={profile} />}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/create" element={user ? <CreateSOP /> : <Navigate to="/login" />} />
              <Route path="/sop/:id" element={user ? <SOPDetail /> : <Navigate to="/login" />} />
              <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
              <Route path="/support" element={user ? <Support /> : <Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function Header({ isAdmin, profile }: { isAdmin: boolean, profile: UserProfile | null }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shadow-sm shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">
            LabSOP<span className="text-blue-600">AI</span>
          </span>
        </Link>

        <nav className="ml-8 hidden md:flex gap-6 text-sm font-medium text-slate-500">
          <Link to="/" className="hover:text-slate-800 py-5 transition-colors">
            Dashboard
          </Link>
          <Link to="/create" className="hover:text-slate-800 py-5 transition-colors">
            Generator
          </Link>
          <Link to="/support" className="hover:text-slate-800 py-5 transition-colors flex items-center gap-1.5">
            <LifeBuoy size={14} className="text-blue-500" />
            Support
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-slate-800 py-5 transition-colors">
              Administrative
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-right mr-2 hidden sm:block">
          <p className="font-semibold leading-none text-slate-800">{profile?.displayName}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 font-bold">
            {profile?.role === 'admin' ? 'Administrative Authority' : 'Laboratory Scientist'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
          <UserIcon size={20} />
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
