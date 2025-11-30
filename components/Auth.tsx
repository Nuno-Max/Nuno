
import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import { User } from '../types';

interface AuthProps {
  onSuccess: (user: User) => void;
  onGoHome: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, onGoHome }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user;
      if (isLogin) {
        user = await loginUser(email, password);
      } else {
        if (!name) throw new Error("Name is required");
        user = await registerUser(name, email, password);
      }
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]"></div>
       </div>

       <div className="w-full max-w-md relative z-10">
          <button onClick={onGoHome} className="mb-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </button>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
             <div className="text-center mb-8">
               <h2 className="text-3xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
               <p className="text-slate-400">
                 {isLogin ? 'Enter your credentials to access your studio' : 'Sign up to start creating with AI'}
               </p>
             </div>

             {error && (
               <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
                 {error}
               </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-4">
               {!isLogin && (
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                   <input 
                     type="text" 
                     className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                     placeholder="John Doe"
                     value={name}
                     onChange={e => setName(e.target.value)}
                     required={!isLogin}
                   />
                 </div>
               )}
               
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                 <input 
                   type="email" 
                   className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                   placeholder="name@example.com"
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   required
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                 <input 
                   type="password" 
                   className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                   placeholder="••••••••"
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   required
                   minLength={6}
                 />
               </div>

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/40 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed mt-6"
               >
                 {loading ? (
                   <div className="flex items-center justify-center gap-2">
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     <span>Please wait...</span>
                   </div>
                 ) : (
                   isLogin ? 'Sign In' : 'Create Account'
                 )}
               </button>
             </form>

             <div className="mt-6 text-center">
               <p className="text-slate-400 text-sm">
                 {isLogin ? "Don't have an account? " : "Already have an account? "}
                 <button 
                   onClick={() => { setIsLogin(!isLogin); setError(''); }}
                   className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                 >
                   {isLogin ? 'Sign Up' : 'Log In'}
                 </button>
               </p>
             </div>
          </div>
       </div>
    </div>
  );
};
