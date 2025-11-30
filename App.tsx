
import React, { useState, useEffect } from 'react';
import { AppView, User } from './types';
import { ImageGen } from './components/ImageGen';
import { ImageEdit } from './components/ImageEdit';
import { ChatInterface } from './components/ChatInterface';
import { Gallery } from './components/Gallery';
import { Home } from './components/Home';
import { Auth } from './components/Auth';
import { getSession, logoutUser } from './services/authService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for session on load
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setCurrentView(AppView.IMAGE_GENERATION);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setCurrentView(AppView.IMAGE_GENERATION);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentView(AppView.HOME);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // --- Public Views (No Sidebar) ---
  if (!user) {
    if (currentView === AppView.AUTH) {
      return <Auth onSuccess={handleLoginSuccess} onGoHome={() => setCurrentView(AppView.HOME)} />;
    }
    return <Home onNavigateToAuth={() => setCurrentView(AppView.AUTH)} />;
  }

  // --- Authenticated App ---
  const renderView = () => {
    switch (currentView) {
      case AppView.IMAGE_GENERATION:
        return <ImageGen />;
      case AppView.IMAGE_EDITING:
        return <ImageEdit />;
      case AppView.CHAT:
        return <ChatInterface />;
      case AppView.GALLERY:
        return <Gallery />;
      default:
        return <ImageGen />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case AppView.IMAGE_GENERATION: return 'Image Generation';
      case AppView.IMAGE_EDITING: return 'Magic Editor';
      case AppView.CHAT: return 'AI Chat Assistant';
      case AppView.GALLERY: return 'My Gallery';
      default: return 'Lumina Studio';
    }
  };

  const NavButton = ({ view, label, icon }: { view: AppView; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center gap-3 px-3 py-3 w-full rounded-lg transition-all duration-200 group relative ${
        currentView === view
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      } ${!isSidebarOpen ? 'justify-center' : ''}`}
      title={!isSidebarOpen ? label : ''}
    >
      <div className="shrink-0">{icon}</div>
      {isSidebarOpen && (
        <span className="font-medium whitespace-nowrap overflow-hidden transition-opacity duration-300">
          {label}
        </span>
      )}
      {!isSidebarOpen && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
          {label}
        </div>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden selection:bg-purple-500/30">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out relative z-30 shadow-2xl`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          {isSidebarOpen && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x whitespace-nowrap">
              Lumina
            </h1>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${!isSidebarOpen ? 'mx-auto' : ''}`}
          >
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-hide">
          <NavButton 
            view={AppView.IMAGE_GENERATION} 
            label="Generate Images" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
          />
          <NavButton 
            view={AppView.IMAGE_EDITING} 
            label="Magic Editor" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>} 
          />
          <NavButton 
            view={AppView.CHAT} 
            label="AI Chat" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>} 
          />
          <div className="my-2 border-t border-slate-800/50"></div>
          <NavButton 
            view={AppView.GALLERY} 
            label="Gallery" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} 
          />
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           {isSidebarOpen ? (
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate w-24">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate w-24">{user.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors" title="Logout">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
             </div>
           ) : (
              <div className="flex justify-center">
                 <div onClick={handleLogout} className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 cursor-pointer hover:ring-2 hover:ring-white transition-all flex items-center justify-center text-xs font-bold" title="Logout">
                    {user.name.charAt(0).toUpperCase()}
                 </div>
              </div>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative">
        <header className="h-16 flex-none border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center px-6 sticky top-0 z-20">
            <h2 className="text-lg font-semibold text-white tracking-wide">
              {getTitle()}
            </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
          <div className="max-w-7xl mx-auto w-full">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
