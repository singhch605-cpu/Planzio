import React from 'react';
import { auth } from '../utils/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
  const { authError } = useAuth();
  const [error, setError] = React.useState('');
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setError('');
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message);
      console.error("Google login failed:", err.code, err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans text-slate-900">
      <div className="w-full max-w-[400px] text-center space-y-12">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[22px] bg-[#001D4F] flex items-center justify-center shadow-2xl shadow-blue-900/20">
            <span className="text-white font-black text-3xl">P</span>
          </div>
          <h1 className="font-black text-4xl tracking-tighter text-[#001D4F]">PLANZIO</h1>
        </div>

        {/* Auth Section */}
        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={48} className="text-blue-900" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm mb-8">Access your project headquarters</p>

          {(error || authError) && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold leading-tight">
              {error || authError}
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-4 rounded-2xl font-bold text-sm hover:border-blue-600 hover:bg-white transition-all group"
          >
            <div className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm border border-slate-100">
              <span className="text-blue-500 text-[10px] font-black">G</span>
            </div>
            Sign in with Google
            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* About Section */}
        <div className="pt-8 border-t border-slate-100 px-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">About Planzio</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Planzio is a next-generation orchestration engine designed to synchronize complex project milestones 
            through autonomous AI agents and real-time dependency tracking. 
            Built for infrastructure teams that demand absolute precision.
          </p>
        </div>

        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-12">
          © 2026 Planzio Systems International
        </p>
      </div>
    </div>
  );
}
