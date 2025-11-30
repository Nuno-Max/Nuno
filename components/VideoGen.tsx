import React, { useState, useRef, useEffect } from 'react';
import { generateVideo, openKeySelection } from '../services/geminiService';
import { saveToGallery, blobUrlToBase64 } from '../services/galleryService';

export const VideoGen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  // Error state removed from UI
  const [statusMessage, setStatusMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [useProMode, setUseProMode] = useState(false); // Default to Free Mode
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !referenceImage) {
      // Keep alert for missing input as it's not a system error
      alert("Please provide a prompt or a reference image.");
      return;
    }
    
    setLoading(true);
    setResultUrl(null);
    setSaved(false);
    
    // Set status message based on mode
    setStatusMessage(useProMode 
      ? 'Initializing Veo Video Engine...' 
      : 'Generating Cinematic Preview (Free)...');

    try {
      const url = await generateVideo(
        prompt, 
        aspectRatio, 
        referenceImage || undefined,
        useProMode // Pass the mode flag
      );
      
      setResultUrl(url);
      
      // Determine if result is video (Veo) or image (Fallback/Free)
      const isVid = url.startsWith('blob:') || url.includes('video');
      setIsVideo(isVid);

    } catch (err: any) {
      // Suppress error display
      console.error(err);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleSaveToGallery = async () => {
    if (!resultUrl || saved) return;
    try {
        let base64Data = resultUrl;
        if (resultUrl.startsWith('blob:')) {
           base64Data = await blobUrlToBase64(resultUrl);
        }

        await saveToGallery({
            id: Date.now().toString(),
            type: isVideo ? 'video' : 'image',
            data: base64Data,
            prompt: prompt || "Generated Content",
            timestamp: Date.now()
        });
        setSaved(true);
    } catch (e) {
        console.error("Failed to save to gallery", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Veo Video Studio
      </h2>
      
      {/* Mode Toggle */}
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
               <h3 className="text-sm font-semibold text-white">
                 {useProMode ? "Mode: Pro Video (Veo)" : "Mode: Fast Preview (Free)"}
               </h3>
               <p className="text-xs text-slate-400 mt-1">
                 {useProMode 
                   ? "Attempts to generate MP4 video. Falls back to image if key invalid." 
                   : "Generates high-quality cinematic preview frames. Always free."}
               </p>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-600 shrink-0">
               <button
                 onClick={() => setUseProMode(false)}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!useProMode ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 Image Preview
               </button>
               <button
                 onClick={() => setUseProMode(true)}
                 className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${useProMode ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 Veo Video
               </button>
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Prompt</label>
          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 outline-none resize-none"
            rows={2}
            placeholder={referenceImage ? "Describe how to animate/transform the image..." : "A cinematic drone shot of a futuristic city..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Aspect Ratio</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex-1 py-3 px-4 rounded-lg border ${aspectRatio === '16:9' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  Landscape (16:9)
                </button>
                <button 
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex-1 py-3 px-4 rounded-lg border ${aspectRatio === '9:16' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  Portrait (9:16)
                </button>
              </div>
           </div>

           <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Reference Image (Optional)
              </label>
              <div className="flex items-center gap-4">
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700 cursor-pointer"
                  />
                  {referenceImage && (
                    <div className="h-10 w-10 relative shrink-0">
                      <img src={referenceImage} alt="Ref" className="h-full w-full object-cover rounded border border-slate-600" />
                      <button 
                        onClick={() => { setReferenceImage(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5"
                      >
                         <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  )}
              </div>
           </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || (!prompt && !referenceImage)}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            loading || (!prompt && !referenceImage)
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : useProMode 
                ? 'bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white shadow-lg shadow-pink-900/50'
                : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white shadow-lg shadow-green-900/50'
          }`}
        >
          {loading 
            ? 'Processing...' 
            : useProMode 
              ? 'Generate Video (Veo)' 
              : 'Generate Preview (Free)'}
        </button>

        {loading && (
          <div className="text-center py-8">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4 ${useProMode ? 'border-pink-500' : 'border-green-500'}`}></div>
            <p className={`${useProMode ? 'text-pink-300' : 'text-green-300'} animate-pulse font-medium`}>{statusMessage}</p>
          </div>
        )}

        {resultUrl && (
          <div className="mt-8 animate-fade-in">
            <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
               {isVideo ? 'Generated Video' : 'Generated Preview Frame'}
               {!isVideo && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600">Free Mode</span>}
            </h3>
            <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-600 bg-black relative group">
              {isVideo ? (
                <video controls className="w-full max-h-[600px] mx-auto" src={resultUrl}>
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="relative">
                   <img src={resultUrl} alt="Video Preview" className="w-full h-auto object-contain max-h-[600px]" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
                      <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm border border-white/20">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                         </svg>
                      </div>
                   </div>
                   <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                      Preview Frame (Simulated Video)
                   </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
               <button
                  onClick={handleSaveToGallery}
                  disabled={saved}
                  className={`px-6 py-2 rounded-lg transition-colors border font-medium ${
                    saved 
                      ? 'bg-slate-700 text-green-400 border-green-500/50' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                  }`}
                >
                  {saved ? 'Saved to Gallery' : 'Save to Gallery'}
                </button>
              <a 
                href={resultUrl} 
                download={isVideo ? `veo-${Date.now()}.mp4` : `preview-${Date.now()}.png`}
                className="inline-block bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors border border-slate-600"
              >
                Download {isVideo ? 'MP4' : 'Image'}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};