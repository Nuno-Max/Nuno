import React, { useState, useEffect } from 'react';
import { generateImage, openKeySelection } from '../services/geminiService';
import { saveToGallery } from '../services/galleryService';
import { AspectRatio, ImageSize } from '../types';

interface HistoryItem {
  prompt: string;
  aspectRatio: AspectRatio;
  size: ImageSize;
  timestamp: number;
}

export const ImageGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [size, setSize] = useState<ImageSize>(ImageSize.K1);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  // Error state removed from UI rendering as requested
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('lumina_image_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setResultImage(null);
    setSaved(false);

    try {
      const img = await generateImage(prompt, aspectRatio, size);
      setResultImage(img);

      // Save to history on success
      const newItem: HistoryItem = { prompt, aspectRatio, size, timestamp: Date.now() };
      
      const newHistory = [
        newItem, 
        ...history.filter(h => 
          h.prompt !== prompt || 
          h.aspectRatio !== aspectRatio || 
          h.size !== size
        )
      ].slice(0, 10);
      
      setHistory(newHistory);
      localStorage.setItem('lumina_image_history', JSON.stringify(newHistory));

    } catch (err: any) {
      // Suppress error display in UI as requested
      console.error("Image generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!resultImage || saved) return;
    try {
      await saveToGallery({
        id: Date.now().toString(),
        type: 'image',
        data: resultImage,
        prompt: prompt,
        timestamp: Date.now()
      });
      setSaved(true);
    } catch (e) {
      console.error("Failed to save to gallery", e);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setAspectRatio(item.aspectRatio);
    setSize(item.size);
    // Scroll to top to see inputs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    if (window.confirm('Clear your prompt history?')) {
      setHistory([]);
      localStorage.removeItem('lumina_image_history');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Gemini Pro Image Generator
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Prompt</label>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            rows={3}
            placeholder="A cyberpunk city with neon lights reflecting on wet pavement..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Aspect Ratio</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            >
              {Object.entries(AspectRatio).map(([key, value]) => (
                <option key={key} value={value}>{key.replace(/_/g, ' ')} ({value})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Size</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              value={size}
              onChange={(e) => setSize(e.target.value as ImageSize)}
            >
              {Object.entries(ImageSize).map(([key, value]) => (
                <option key={key} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            loading || !prompt
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/50'
          }`}
        >
          {loading ? 'Dreaming...' : 'Generate Image'}
        </button>

        {resultImage && (
          <div className="mt-8 animate-fade-in">
            <h3 className="text-lg font-medium text-white mb-2">Result</h3>
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-600 group">
              <img src={resultImage} alt="Generated result" className="w-full h-auto object-contain max-h-[600px] bg-black" />
              
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={handleSaveToGallery}
                  disabled={saved}
                  className={`px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-colors border ${
                    saved 
                      ? 'bg-green-600/90 text-white border-green-500' 
                      : 'bg-slate-900/80 hover:bg-black text-white border-slate-600'
                  }`}
                >
                  {saved ? 'Saved to Gallery' : 'Save to Gallery'}
                </button>
                <a 
                  href={resultImage} 
                  download={`gemini-${Date.now()}.png`}
                  className="bg-slate-900/80 hover:bg-black text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-colors border border-slate-600"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Recent Prompts History */}
        {history.length > 0 && (
          <div className="mt-8 border-t border-slate-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-300 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Recent Prompts
              </h3>
              <button 
                onClick={clearHistory} 
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="grid gap-3 grid-cols-1">
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => loadHistoryItem(item)}
                  className="text-left bg-slate-900/50 hover:bg-slate-700/80 border border-slate-700 p-3 rounded-lg transition-all group"
                >
                  <p className="text-sm text-slate-200 line-clamp-1 font-medium mb-1.5">{item.prompt}</p>
                  <div className="flex gap-2 text-xs text-slate-500 items-center">
                     <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600/50">{item.aspectRatio}</span>
                     <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600/50">{item.size}</span>
                     <span className="text-slate-600">•</span>
                     <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                     <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-purple-400 font-medium">Load Settings →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};