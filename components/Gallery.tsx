import React, { useEffect, useState, useRef } from 'react';
import { GalleryItem } from '../types';
import { getGalleryItems, deleteGalleryItem } from '../services/galleryService';

// Helper component to handle auto-play when visible (Grid View)
const GalleryVideoItem = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoElement.play().catch(e => {
              console.debug("Autoplay prevented", e);
            });
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.5 } // Play when 50% visible
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full h-full object-cover"
      muted
      loop
      playsInline
    />
  );
};

// Custom Video Player for Lightbox with Controls
const CustomVideoPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Auto play when opened
    const vid = videoRef.current;
    if (vid) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    if (isPlaying) {
      vid.pause();
    } else {
      vid.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (vid) {
      setCurrentTime(vid.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (vid) {
      setDuration(vid.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative group w-full h-full flex items-center justify-center bg-black rounded shadow-lg overflow-hidden" onClick={togglePlay}>
       <video 
         ref={videoRef}
         src={src}
         className="max-w-full max-h-full"
         onTimeUpdate={handleTimeUpdate}
         onLoadedMetadata={handleLoadedMetadata}
         onEnded={() => setIsPlaying(false)}
         playsInline
       />
       
       {/* Controls Overlay */}
       <div 
         className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col gap-2 z-10" 
         onClick={e => e.stopPropagation()}
       >
          {/* Seek Bar */}
          <input 
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:hover:scale-110 transition-all"
          />
          
          <div className="flex items-center justify-between mt-1">
             <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors focus:outline-none">
               {isPlaying ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                 </svg>
               )}
             </button>
             
             <span className="text-xs text-slate-300 font-mono tracking-wider">
               {formatTime(currentTime)} / {formatTime(duration)}
             </span>
          </div>
       </div>
       
       {/* Center Play Button (visible when paused) */}
       {!isPlaying && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 rounded-full p-5 backdrop-blur-sm border border-white/10 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
            </div>
         </div>
       )}
    </div>
  );
};

export const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const data = await getGalleryItems();
      setItems(data);
    } catch (e) {
      console.error("Failed to load gallery:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteGalleryItem(id);
      if (selectedItem?.id === id) setSelectedItem(null);
      await loadGallery();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Gallery
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xl text-slate-400 font-medium">No items in gallery yet</p>
          <p className="text-slate-500 mt-2">Generate images or videos and save them to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="group relative bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:border-cyan-500 transition-all cursor-pointer aspect-square"
              onClick={() => setSelectedItem(item)}
            >
              {item.type === 'video' ? (
                <GalleryVideoItem src={item.data} />
              ) : (
                <img src={item.data} alt={item.prompt} className="w-full h-full object-cover" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-sm line-clamp-2 font-medium mb-2">{item.prompt}</p>
                <div className="flex justify-between items-center">
                   <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                   <button 
                     onClick={(e) => handleDelete(e, item.id)}
                     className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition-colors"
                     title="Delete"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                   </button>
                </div>
              </div>
              
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm uppercase font-bold tracking-wider">
                {item.type}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="max-w-5xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
               <h3 className="text-lg font-medium text-white truncate pr-4">{selectedItem.prompt}</h3>
               <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white p-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-4">
               {selectedItem.type === 'video' ? (
                 <div className="w-full max-w-4xl max-h-[60vh] aspect-video">
                   <CustomVideoPlayer src={selectedItem.data} />
                 </div>
               ) : (
                 <img src={selectedItem.data} alt={selectedItem.prompt} className="max-w-full max-h-full object-contain rounded shadow-lg" />
               )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
              <div className="text-sm text-slate-400">
                Generated on {new Date(selectedItem.timestamp).toLocaleString()}
              </div>
              <div className="flex gap-3">
                 <button 
                   onClick={(e) => handleDelete(e, selectedItem.id)}
                   className="px-4 py-2 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg text-sm font-medium transition-colors"
                 >
                   Delete
                 </button>
                 <a 
                   href={selectedItem.data} 
                   download={`lumina-${selectedItem.type}-${selectedItem.timestamp}${selectedItem.type === 'video' ? '.mp4' : '.png'}`}
                   className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-900/50"
                 >
                   Download
                 </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};