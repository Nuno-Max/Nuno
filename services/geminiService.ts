
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from "../types";

// Helper to manually trigger key selection from UI
export const openKeySelection = async () => {
  if (typeof window !== 'undefined' && window.aistudio && window.aistudio.openSelectKey) {
    try {
      await window.aistudio.openSelectKey();
    } catch (e) {
      console.error("Failed to open key selection:", e);
    }
  }
};

// Helper to ensure API Key exists
const getClient = () => {
  // Use a fallback to allow SDK initialization. 
  // Real authentication is handled by the API response (403/400) triggering the key selection dialog.
  const apiKey = process.env.API_KEY || "lazy_auth_key";
  return new GoogleGenAI({ apiKey });
};

// Helper to handle permission errors and retry
// requireAuth: If false, it suppresses the "Select Key" dialog and just throws the error 
// so the caller can handle the fallback silently.
const runWithAuthRetry = async <T>(operation: () => Promise<T>, requireAuth: boolean = true): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    let msg = "";
    let isPermissionError = false;

    // 1. Extract string message from various error types
    if (error instanceof Error) {
      msg = error.message;
    } else if (typeof error === 'object' && error !== null) {
      msg = JSON.stringify(error);
    } else {
      msg = String(error);
    }

    // 2. Try to parse JSON message
    try {
        const jsonStart = msg.indexOf('{');
        const jsonEnd = msg.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = msg.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
                if (
                    parsed.error.code === 403 || 
                    parsed.error.status === "PERMISSION_DENIED" ||
                    parsed.error.code === 404 ||
                    parsed.error.status === "NOT_FOUND" ||
                    parsed.error.code === 400 ||
                    (parsed.error.message && parsed.error.message.includes("quota"))
                ) {
                    isPermissionError = true;
                }
                if (parsed.error.message) msg = parsed.error.message;
            }
        }
    } catch (e) {
        // Ignore parse errors
    }

    // 3. Fallback check for string patterns
    if (!isPermissionError) {
       if (
        msg.includes("403") || 
        msg.includes("PERMISSION_DENIED") || 
        msg.includes("The caller does not have permission") ||
        msg.includes("API_KEY is not defined") || 
        msg.includes("API key not valid") ||
        msg.includes("INVALID_ARGUMENT") ||
        msg.includes("quota") || 
        msg.includes("404") || 
        msg.includes("NOT_FOUND") ||
        msg.includes("Requested entity was not found")
      ) {
        isPermissionError = true;
      }
    }

    // 4. Trigger Retry Logic ONLY if requireAuth is true
    if (isPermissionError && requireAuth) {
      if (typeof window !== 'undefined' && window.aistudio && window.aistudio.openSelectKey) {
        console.warn("Auth/Model access error detected. Prompting user for API Key...");
        try {
          await window.aistudio.openSelectKey();
          return await operation();
        } catch (retryError: any) {
           throw new Error("Connection failed. Please select a valid API Key.");
        }
      }
    }

    // 5. Final Throw
    throw new Error(msg); 
  }
};

// --- Image Generation (Silent Fallback) ---
export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize
): Promise<string> => {
  
  const extractImageFromResponse = (response: any) => {
      const parts = response.candidates?.[0]?.content?.parts;
      let textRefusal = "";
      if (parts) {
          for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                  return `data:image/png;base64,${part.inlineData.data}`;
              }
              if (part.text) {
                  textRefusal += part.text;
              }
          }
      }
      if (textRefusal) throw new Error(`Model refused: ${textRefusal}`);
      throw new Error("No image data returned.");
  };

  // 1. Try Gemini 3 Pro (High Quality) - Silent Fail
  try {
      const ai = getClient();
      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
              imageConfig: {
                  aspectRatio: aspectRatio,
                  imageSize: imageSize,
              },
          },
      });
      return extractImageFromResponse(response);
  } catch (err: any) {
      console.warn("Pro Image Gen failed, falling back to Flash silently.", err.message);
      // 2. Fallback to Gemini 2.5 Flash Image - Retry Auth enabled here if this also fails
      return runWithAuthRetry(async () => {
          const ai = getClient();
          const responseFlash = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: prompt }] },
              config: {}
          });
          return extractImageFromResponse(responseFlash);
      }, true);
  }
};

// --- Image Editing (Gemini 2.5 Flash Image) ---
export const editImage = async (
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/png'
): Promise<string> => {
  
  const apiCall = async () => {
    const ai = getClient();
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    let textRefusal = "";

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
        if (part.text) textRefusal += part.text;
      }
    }

    if (textRefusal) throw new Error(`Model unable to edit: ${textRefusal}`);
    throw new Error("No edited image returned.");
  };

  return runWithAuthRetry(apiCall, true);
};

// --- Chat with Search ---
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  useSearch: boolean
): Promise<{ text: string; groundingChunks?: any[] }> => {
  const apiCall = async () => {
    const ai = getClient();
    const model = useSearch ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
    const tools = useSearch ? [{ googleSearch: {} }] : undefined;
    const chat = ai.chats.create({
      model: model,
      config: { tools: tools, systemInstruction: "Format response in Markdown." },
      history: history,
    });
    const result = await chat.sendMessage({ message });
    return { text: result.text || "", groundingChunks: result.candidates?.[0]?.groundingMetadata?.groundingChunks };
  };
  return runWithAuthRetry(apiCall, true);
};

// --- Video Generation (Veo) ---
export const generateVideo = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  referenceImage?: string,
  useProMode: boolean = false
): Promise<string> => {
  // If not pro mode, fallback to image generation (Flash)
  if (!useProMode) {
     if (referenceImage) {
         // Reuse existing editImage for consistency
         const mimeType = referenceImage.match(/data:([^;]+);base64/)?.[1] || 'image/png';
         return editImage(referenceImage, prompt || "Enhance this", mimeType);
     } else {
         // Reuse existing generateImage
         const ratioEnum = aspectRatio === '16:9' ? AspectRatio.WIDE_LANDSCAPE : AspectRatio.WIDE_PORTRAIT;
         return generateImage(prompt || "Preview", ratioEnum, ImageSize.K1);
     }
  }

  // Pro Mode: Veo
  return runWithAuthRetry(async () => {
      const ai = getClient();
      
      const config: any = {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
      };

      // Construct request
      const model = 'veo-3.1-fast-generate-preview';
      let request: any = {
          model,
          config,
          prompt: prompt || undefined
      };
      
      if (referenceImage) {
           const base64Data = referenceImage.split(',')[1] || referenceImage;
           const mimeType = referenceImage.match(/data:([^;]+);base64/)?.[1] || 'image/png';
           request.image = {
               imageBytes: base64Data,
               mimeType: mimeType
           };
      }
      
      if (!request.prompt && !request.image) {
          throw new Error("Prompt or Image required for video generation");
      }

      let operation = await ai.models.generateVideos(request);

      // Poll for completion
      while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) throw new Error("Video generation failed: No URI returned");

      // Download using API Key
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key required for download");
      
      const res = await fetch(`${videoUri}&key=${apiKey}`);
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
      
      const blob = await res.blob();
      return URL.createObjectURL(blob);
  }, true);
};

// --- Video Analysis ---
export const analyzeVideoContent = async (
    base64Data: string, 
    mimeType: string, 
    prompt: string
): Promise<string> => {
    return runWithAuthRetry(async () => {
        const ai = getClient();
        const data = base64Data.split(',')[1] || base64Data;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: data
                        }
                    },
                    { text: prompt }
                ]
            }
        });
        
        return response.text || "No analysis generated.";
    }, true);
};
