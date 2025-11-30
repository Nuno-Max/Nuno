import React, { useState } from 'react';
import { analyzeVideoContent } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Describe what is happening in this video in detail.');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic size check for this frontend demo (limit to ~10MB for base64 safety)
      if (file.size > 10 * 1024 * 1024) {
        setError("File too large. For this demo, please use videos under 10MB.");
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }
      setVideoFile(file);
      setError(null);
      setVideoPreview(URL.createObjectURL(file));
      setAnalysis('');
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile || !prompt) return;
    setLoading(true);
    setError(null);
    setAnalysis('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Video = reader.result as string;
        // Strip prefix if needed is handled in service, but let's pass it raw
        const result = await analyzeVideoContent(base64Video, videoFile.type, prompt);
        setAnalysis(result);
      } catch (err: any) {
        setError(err.message || "Analysis failed.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(videoFile);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Video Intelligence (Gemini 3 Pro)
      </h2>

      <div className="space-y-6">
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-900/50">
           {videoPreview ? (
             <div className="w-full max-w-md">
                <video src={videoPreview} controls className="w-full rounded shadow-lg border border-slate-700 mb-4" />
                <button 
                  onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                  className="text-sm text-red-400 hover:text-red-300 underline w-full text-center"
                >
                  Remove Video
                </button>
             </div>
           ) : (
             <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-slate-400 text-sm mb-4">Upload a short video clip (Max 10MB)</p>
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleFileChange}
                  className="block text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-600 file:text-white hover:file:bg-yellow-700 cursor-pointer"
                />
             </>
           )}
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-300 mb-1">Question / Prompt</label>
           <div className="flex gap-2">
             <input
               type="text"
               className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
             <button
              onClick={handleAnalyze}
              disabled={loading || !videoFile}
              className={`px-6 rounded-lg font-semibold transition-all ${
                loading || !videoFile
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg'
              }`}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
           </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {analysis && (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 mt-6">
             <h3 className="text-lg font-medium text-yellow-500 mb-3">Analysis Result</h3>
             <div className="prose prose-invert prose-sm max-w-none text-slate-300">
               <ReactMarkdown>{analysis}</ReactMarkdown>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};