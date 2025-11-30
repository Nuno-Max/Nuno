
import React from 'react';

interface HomeProps {
  onNavigateToAuth: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigateToAuth }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative overflow-hidden">
      {/* Abstract Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-serif italic text-lg">L</span>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Lumina Studio</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onNavigateToAuth}
            className="text-slate-300 hover:text-white font-medium transition-colors"
          >
            Login
          </button>
          <button 
            onClick={onNavigateToAuth}
            className="px-5 py-2 rounded-full bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-10 md:mt-0">
        <div className="inline-block px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-900/20 text-purple-300 text-sm font-medium mb-8 backdrop-blur-md">
          ✨ Powered by Gemini 3 Pro & Flash
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Unleash your creativity with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            Next-Gen AI Tools
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Create stunning images, edit photos with magic commands, and chat with an intelligent assistant. All in one studio.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={onNavigateToAuth}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-xl shadow-purple-900/40 hover:scale-105"
          >
            Start Creating for Free
          </button>
          <button 
            onClick={onNavigateToAuth}
            className="px-8 py-4 rounded-xl bg-slate-800/50 border border-slate-700 text-white font-semibold text-lg hover:bg-slate-800 transition-all hover:border-slate-500 backdrop-blur-sm"
          >
            Explore Gallery
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <FeatureCard 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            title="Image Generation"
            desc="Turn text into breathtaking 4K art using Gemini 3 Pro."
            color="bg-pink-500"
          />
          <FeatureCard 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
            title="Magic Editing"
            desc="Upload photos and edit them using natural language commands."
            color="bg-green-500"
          />
          <FeatureCard 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            title="Smart Chat"
            desc="Chat with an AI that has access to Google Search grounding."
            color="bg-blue-500"
          />
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-800 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Lumina Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) => (
  <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 transition-colors group">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white mb-4 shadow-lg`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{title}</h3>
    <p className="text-slate-400">{desc}</p>
  </div>
);
