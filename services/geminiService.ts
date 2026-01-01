import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChatAnalysis, GeneratedReply, VibeType, CustomVibeConfig, IcebreakerSuggestion } from '../types';

// Helper to get fresh client instance (important if API_KEY changes in runtime)
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
export const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Helper to decode base64 to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Helper to process PCM data into AudioBuffer
 */
export async function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Analyzes the chat context (files + text) to understand the partner's style.
 * Uses gemini-3-pro-preview for deep reasoning.
 */
export const analyzeContext = async (files: File[], text: string, language: string): Promise<ChatAnalysis> => {
  try {
    const ai = getAiClient();
    const fileParts = await Promise.all(files.map(fileToPart));
    
    // We construct a multipart request
    const contents = [
      ...fileParts,
      { text: `
        Analyze the conversation context provided (screenshots, screen recordings, audio/call recordings, and/or text).
        Focus on the "Partner's" communication style.
        Ignore the "User" (me).
        
        Language Context: The conversation is happening in ${language || "the language detected in the files"}.
        Additional context: ${text}
        
        Identify:
        1. Their emotional baseline and key patterns.
        2. "Red Flags": Look for signs of gaslighting, manipulation, love-bombing, negging, or passive-aggressiveness. If none, leave empty.
        3. Personality Metrics (0-100 score):
           - Empathy: How caring/understanding are they?
           - Aggression: How confrontational/dominant?
           - Humor: How funny/playful?
           - Vulnerability: How open/emotional?
           - Clarity: How direct/easy to understand?
        
        Return a JSON object with:
        - summary: A direct, highly actionable piece of advice addressed to the user ("You").
        - tags: Array of short behavioral tags.
        - partnerStyle: Brief description of their vibe.
        - redFlags: Array of strings describing any toxic behavior found (e.g., "Deflects blame", "Uses guilt").
        - personalityMetrics: Object with numeric scores (0-100) for empathy, aggression, humor, vulnerability, clarity.
      ` }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            partnerStyle: { type: Type.STRING },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            personalityMetrics: {
                type: Type.OBJECT,
                properties: {
                    empathy: { type: Type.NUMBER },
                    aggression: { type: Type.NUMBER },
                    humor: { type: Type.NUMBER },
                    vulnerability: { type: Type.NUMBER },
                    clarity: { type: Type.NUMBER }
                },
                required: ["empathy", "aggression", "humor", "vulnerability", "clarity"]
            }
          },
          required: ["summary", "tags", "partnerStyle", "redFlags", "personalityMetrics"]
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as ChatAnalysis;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Generates replies based on the analysis and selected vibe.
 * Uses gemini-3-pro-preview for high-quality creative writing.
 */
export const generateReplies = async (
  analysis: ChatAnalysis,
  vibe: VibeType | string,
  customVibe: CustomVibeConfig | null,
  intensity: number,
  files: File[],
  textContext: string,
  language: string,
  historyOverride?: string // New parameter for continuous chat
): Promise<GeneratedReply[]> => {
  try {
    const ai = getAiClient();
    const fileParts = await Promise.all(files.map(fileToPart));

    const intensityDesc = intensity > 80 ? "Bold, high risk, very direct" : intensity > 40 ? "Balanced, clear interest" : "Safe, subtle, low pressure";
    
    let vibeInstructions = "";
    if (vibe === VibeType.Custom && customVibe) {
        vibeInstructions = `Custom Vibe: ${customVibe.label}. Description of intent: ${customVibe.description}.`;
    } else {
        vibeInstructions = `Vibe: ${vibe}.`;
        if (vibe === VibeType.Spark) vibeInstructions += " Use playful teasing.";
        if (vibe === VibeType.Repair) vibeInstructions += " Validate their feelings first.";
        if (vibe === VibeType.Humorous) vibeInstructions += " Use wit and lighthearted banter.";
        if (vibe === VibeType.Empathetic) vibeInstructions += " Prioritize validation and warmth.";
    }

    const contextToUse = historyOverride 
        ? `ORIGINAL BACKGROUND CONTEXT: ${textContext}\n\nUPDATED CONVERSATION LOG (Most recent at bottom):\n${historyOverride}` 
        : `Additional Text Context: ${textContext}`;

    const prompt = `
      ROLE: You are an empathy engine. 
      Analyze the partner's communication style from the context.
      Match their energy. 
      
      CONTEXT:
      Partner Style: ${analysis.partnerStyle}
      Analysis: ${analysis.summary}
      ${contextToUse}
      Language: ${language || "Match the language used in the context files"}
      
      TASK:
      Generate 3 distinct reply options for the user to send back.
      
      PARAMETERS:
      ${vibeInstructions}
      Intensity: ${intensity}% (${intensityDesc})
      
      INSTRUCTIONS:
      - Match the partner's energy but nudge it towards the selected Vibe.
      - Keep it authentic to a human conversation.
      - Ensure the replies are in ${language || "the same language as the conversation"}.
      
      Return JSON:
      Array of objects with:
      - text: The message to send.
      - tone: 1-2 words describing the tone.
      - reasoning: Why this works psychologically.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...fileParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              tone: { type: Type.STRING },
              reasoning: { type: Type.STRING }
            },
            required: ["text", "tone", "reasoning"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText) as GeneratedReply[];

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

/**
 * Generates speech from text using Gemini 2.5 Flash TTS.
 */
export const generateSpeech = async (text: string, tone: string): Promise<Uint8Array> => {
    try {
        const ai = getAiClient();
        const prompt = `Say the following with a ${tone} tone: "${text}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from Gemini.");
        }

        return base64ToBytes(base64Audio);

    } catch (error) {
        console.error("Gemini TTS Error:", error);
        throw error;
    }
};

/**
 * Generates a reaction image / visual aid based on the context.
 * Uses gemini-3-pro-image-preview for generation, falls back to gemini-2.5-flash-image.
 */
export const generateReactionImage = async (
    analysis: ChatAnalysis
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `A high quality 3D render of a cute round emoji character expressing "${analysis.partnerStyle}". Digital art, sticker style, white background, expressive face.`;

    const extractImage = (response: any) => {
        let base64Image = "";
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                }
            }
        }
        return base64Image;
    };

    try {
        // Attempt 1: Gemini 3 Pro (Higher Quality)
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: "1K"
                }
            }
        });

        const image = extractImage(response);
        if (!image) throw new Error("No image in Pro response");
        return image;

    } catch (error) {
        console.warn("Pro Image Generation failed, falling back to Flash Image.", error);
        
        // Attempt 2: Gemini 2.5 Flash Image (Fallback)
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: {
                        aspectRatio: "1:1"
                        // Note: imageSize is NOT supported in Flash Image
                    }
                }
            });
            
            const image = extractImage(response);
            if (!image) throw new Error("No image in Flash response");
            return image;
            
        } catch (fallbackError) {
            console.error("Image Gen Error (Fallback)", fallbackError);
            throw fallbackError;
        }
    }
}

/**
 * Handles the "Ask the Coach" chat functionality.
 */
export const askRelationshipCoach = async (
  globalFiles: File[],
  globalText: string,
  language: string,
  history: { role: 'user' | 'model', text: string }[],
  question: string,
  currentTurnFiles: File[] = []
): Promise<string> => {
  try {
    const ai = getAiClient();
    const globalFileParts = await Promise.all(globalFiles.map(fileToPart));
    const currentFilesParts = await Promise.all(currentTurnFiles.map(fileToPart));

    const contents = [];

    const contextPrompt = `
      CONTEXT:
      You are an expert Relationship Coach.
      I have provided global context files.
      Global Note: ${globalText || "None"}
      Language: ${language}
      
      INSTRUCTIONS:
      - Answer based on ALL files provided.
      - Be empathetic, realistic, and concise.
    `;

    if (history.length === 0) {
        contents.push({
            role: 'user',
            parts: [
                ...globalFileParts,
                ...currentFilesParts,
                { text: contextPrompt + "\n\nUser Question: " + question }
            ]
        });
    } else {
        contents.push({
            role: 'user',
            parts: [...globalFileParts, { text: contextPrompt }]
        });
        contents.push({ role: 'model', parts: [{ text: "Understood. I've analyzed the context." }] });
        
        history.forEach(msg => {
            contents.push({
                role: msg.role,
                parts: [{ text: msg.text }]
            });
        });
        
        contents.push({
            role: 'user',
            parts: [...currentFilesParts, { text: question }]
        });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
    });

    return response.text || "I couldn't quite analyze that. Could you rephrase?";

  } catch (error) {
    console.error("Coach Chat Error:", error);
    return "I'm having a little trouble connecting to my intuition right now. Please try again in a moment.";
  }
};

/**
 * Generates dating profile icebreakers/openers based on profile images/bios.
 */
export const generateIcebreakers = async (
    files: File[], 
    bioText: string
): Promise<IcebreakerSuggestion[]> => {
    try {
        const ai = getAiClient();
        const fileParts = await Promise.all(files.map(fileToPart));
        
        const prompt = `
            Analyze these dating profile assets and bio.
            Bio Text: "${bioText}"
            
            Generate 4 distinct opening lines (Icebreakers):
            1. Observation
            2. Playful
            3. Direct
            4. Creative
            
            Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
                parts: [...fileParts, { text: prompt }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            category: { type: Type.STRING, enum: ['Observation', 'Playful', 'Direct', 'Creative'] },
                            text: { type: Type.STRING },
                            whyItWorks: { type: Type.STRING }
                        },
                        required: ["category", "text", "whyItWorks"]
                    }
                }
            }
        });

        const jsonText = response.text || "[]";
        return JSON.parse(jsonText) as IcebreakerSuggestion[];

    } catch (error) {
        console.error("Icebreaker Error:", error);
        throw error;
    }
}

/**
 * Simulates the partner in a roleplay chat.
 */
export const simulatePartnerReply = async (
    history: { role: 'user' | 'model', text: string }[],
    analysis: ChatAnalysis,
    userMessage: string
): Promise<string> => {
    const ai = getAiClient();
    const prompt = `
        You are roleplaying as the user's "Partner" based on previous analysis.
        Partner Style: ${analysis.partnerStyle}
        Summary of habits: ${analysis.summary}
        Personality Traits:
        - Empathy: ${analysis.personalityMetrics?.empathy || 50}/100
        - Aggression: ${analysis.personalityMetrics?.aggression || 10}/100
        - Humor: ${analysis.personalityMetrics?.humor || 50}/100
        
        INSTRUCTIONS:
        - Reply to the user's latest message as the Partner would.
        - Match their length, tone, and emoji usage strictly.
        - Do NOT break character. Do NOT give advice. Just reply.
        
        Latest User Message: "${userMessage}"
    `;
    
    // We send only text history to keep it lightweight for the roleplay loop
    const chatHistory = history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [
                ...chatHistory,
                { role: 'user', parts: [{ text: prompt }] }
            ]
        });
        return response.text || "...";
    } catch(e) {
        return "(Roleplay error)";
    }
}