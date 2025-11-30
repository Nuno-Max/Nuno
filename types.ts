
export enum AppView {
  HOME = 'HOME',
  AUTH = 'AUTH', // Handles Login and Register
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  IMAGE_EDITING = 'IMAGE_EDITING',
  CHAT = 'CHAT',
  GALLERY = 'GALLERY',
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  WIDE_PORTRAIT = '9:16',
  WIDE_LANDSCAPE = '16:9',
  CINEMATIC = '21:9',
  STANDARD_PORTRAIT = '2:3',
  STANDARD_LANDSCAPE = '3:2'
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  groundingUrls?: Array<{uri: string; title: string}>;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  data: string; // Base64 string
  prompt: string;
  timestamp: number;
  mimeType?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

// Add global declaration for aistudio to avoid 'as any' casting
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
