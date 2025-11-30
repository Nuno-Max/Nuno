import React, { useState, useRef, useEffect } from 'react';
import { editImage, openKeySelection } from '../services/geminiService';
import { saveToGallery } from '../services/galleryService';

export const ImageEdit: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  
  // History State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Error state removed from UI rendering
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo is available if we have history to go back to OR if we have a pending result (Undo = Discard)
  const canUndo = historyIndex > 0 || !!resultImage;
  const canRedo = historyIndex < history.length - 1;
  const currentImage = historyIndex >= 0 ? history[historyIndex] : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setHistory([base64]);
        setHistoryIndex(0);
        setResultImage(null);
        setPrompt('');
        setSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!prompt || !currentImage) return;
    setLoading(true);
    setSaved(false);

    try {
      const edited = await editImage(currentImage, prompt);
      setResultImage(edited);
    } catch (err: any) {
      // Suppress UI error
      console.error("Edit failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (resultImage) {
      // Truncate history if we are not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(resultImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setResultImage(null);
      setPrompt('');
      setSaved(false);
    }
  };

  const handleDiscard = () => {
    setResultImage(null);
    setSaved(false);
  };

  const handleUndo = () => {
    if (resultImage) {
      handleDiscard();
      return;
    }
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setResultImage(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setResultImage(null);
    }
  };

  const handleReset = () => {
    setHistory([]);
    setHistoryIndex(-1);
    setResultImage(null);
    setPrompt('');
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveToGallery = async () => {
    if (!resultImage || saved) return;
    try {
      await saveToGallery({
        id: Date.now().toString(),
        type: 'image',
        data: resultImage,
        prompt: prompt || "Edited Image",
        timestamp: Date.now()
      });
      setSaved(true);
    } catch (e) {
      console.error("Failed to save to gallery", e);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (resultImage) {
          handleDiscard();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, resultImage, handleUndo, handleRedo]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Magic Editor (Flash Image)
      </h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input / History */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-slate-200">Current Image</h3>
              
              {currentImage && (
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                  <button 
                    onClick={handleUndo} 
                    disabled={!canUndo}
                    className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${!canUndo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300'}`}
                    title="Undo (Ctrl+Z)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="text-xs text-slate-500 font-mono w-20 text-center select-none">
                    Ver {historyIndex + 1} / {history.length}
                  </span>
                  <button 
                    onClick={handleRedo} 
                    disabled={!canRedo}
                    className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${!canRedo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300'}`}
                    title="Redo (Ctrl+Y)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className={`relative border-2 border-dashed border-slate-600 rounded-lg h-[400px] flex flex-col items-center justify-center bg-slate-900/50 transition-colors overflow-hidden ${!currentImage ? 'hover:bg-slate-900' : ''}`}>
               {currentImage ? (
                 <div className="relative w-full h-full group bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==')]">
                   <img src={currentImage} alt="Current" className="w-full h-full object-contain backdrop-blur-sm" />
                   <button 
                    onClick={handleReset}
                    className="absolute top-4 right-4 bg-red-600/90 hover:bg-red-500 p-2 rounded-lg text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100"
                    title="Clear Image"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                   </button>
                 </div>
               ) : (
                 <div className="text-center p-4">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                   <p className="text-slate-400 font-medium mb-1">Upload an image to start editing</p>
                   <p className="text-slate-600 text-sm mb-4">Supports JPG, PNG</p>
                   <label className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors inline-block">
                     <span>Browse Files</span>
                     <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden"
                     />
                   </label>
                 </div>
               )}
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Edit Instructions</label>
              <div className="flex gap-2">
                <textarea
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={2}
                  placeholder="E.g., Make it look like a pencil sketch, add a hat..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={!currentImage || loading}
                />
                <button
                  onClick={handleEdit}
                  disabled={loading || !prompt || !currentImage}
                  className={`px-6 rounded-lg font-semibold transition-all flex items-center justify-center ${
                    loading || !prompt || !currentImage
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-900/50'
                  }`}
                  title="Generate Edit"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Result Preview */}
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-2">
               <h3 className="text-lg font-medium text-slate-200">Preview Result</h3>
               {resultImage && (
                 <span className="text-green-400 text-sm font-medium animate-pulse">
                   Edit Generated!
                 </span>
               )}
             </div>

             <div className="bg-slate-900/50 rounded-lg h-[400px] border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==')]">
              {loading ? (
                <div className="flex flex-col items-center z-10 p-6 bg-slate-900/80 rounded-xl backdrop-blur-md">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
                   <p className="text-slate-300 font-medium">Processing with Gemini...</p>
                   <p className="text-slate-500 text-sm mt-1">Applying your edits</p>
                </div>
              ) : resultImage ? (
                <div className="relative w-full h-full flex flex-col">
                  <div className="flex-1 relative overflow-hidden">
                    <img src={resultImage} alt="Edited" className="w-full h-full object-contain backdrop-blur-sm" />
                  </div>
                  
                  {/* Actions for Result */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                    <button 
                      onClick={handleDiscard}
                      className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg backdrop-blur-sm border border-red-500/50 transition-colors font-medium text-sm"
                      title="Discard this edit"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handleApply}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-green-900/50 transition-all font-semibold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Keep This Edit
                    </button>
                    <button
                      onClick={handleSaveToGallery}
                      disabled={saved}
                      className={`p-2.5 rounded-lg transition-colors border ${
                        saved 
                          ? 'bg-slate-700 text-green-400 border-green-500/50' 
                          : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                      }`}
                      title={saved ? "Saved to Gallery" : "Save to Gallery"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <a 
                      href={resultImage} 
                      download={`edited-gemini-${Date.now()}.png`}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg border border-slate-600 transition-colors"
                      title="Download this version"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 opacity-50 z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-slate-400">Edited result will appear here</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
               <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tips</h4>
               <ul className="text-sm text-slate-400 space-y-1 list-disc pl-4">
                 <li>Describe the change you want clearly (e.g. "Add a red hat").</li>
                 <li>Click <strong>Keep This Edit</strong> to save the result and continue editing.</li>
                 <li>Use <strong>Ctrl+Z</strong> to Undo or Discard Preview.</li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};