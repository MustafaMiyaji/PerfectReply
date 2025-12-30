import { GoogleGenAI, Type } from "@google/genai";
import { ChatAnalysis, GeneratedReply, VibeType, CustomVibeConfig } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
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
 * Analyzes the chat context (files + text) to understand the partner's style.
 * Uses gemini-3-pro-preview for deep reasoning.
 */
export const analyzeContext = async (files: File[], text: string, language: string): Promise<ChatAnalysis> => {
  try {
    const fileParts = await Promise.all(files.map(fileToPart));
    
    // We construct a multipart request
    const contents = [
      ...fileParts,
      { text: `
        Analyze the conversation context provided (screenshots, screen recordings, audio/call recordings, and/or text).
        If a video is provided, treat it as a scrolling view of a chat history.
        If audio is provided, treat it as a conversation recording.
        Focus on the "Partner's" communication style.
        Ignore the "User" (me).
        
        Language Context: The conversation is happening in ${language || "the language detected in the files"}.
        Additional context: ${text}
        
        Identify:
        1. Their emotional baseline (Are they dry? Enthusiastic? Passive-aggressive?)
        2. Key patterns (Do they use emojis? Short texts? Long paragraphs?)
        3. The dynamic (Is it tense? Flirty? Professional?)
        
        Return a JSON object with:
        - summary: A direct, highly actionable piece of advice addressed to the user ("You"). Tell the user exactly how to adapt their communication style to match the partner. (e.g., "They are very concise, so avoid sending long paragraphs to keep the momentum going."). Ensure this is practical, specific to this conversation, and NOT generic.
        - tags: Array of short behavioral tags (e.g., "Direct", "EmojiUser").
        - partnerStyle: Brief description of their vibe.
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
            partnerStyle: { type: Type.STRING }
          },
          required: ["summary", "tags", "partnerStyle"]
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
  language: string
): Promise<GeneratedReply[]> => {
  try {
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

    // "System Instruction" logic embedded in prompt as per best practices for variable integration
    const prompt = `
      ROLE: You are an empathy engine. 
      Analyze the partner's communication style from the context.
      Match their energy. 
      If they are dry, do not overwhelm them. 
      If they are emotional, validate them first.
      
      CONTEXT:
      Partner Style: ${analysis.partnerStyle}
      Analysis: ${analysis.summary}
      Additional Text Context: ${textContext}
      Language: ${language || "Match the language used in the context files"}
      
      TASK:
      Generate 3 distinct reply options for the user to send back.
      
      PARAMETERS:
      ${vibeInstructions}
      Intensity: ${intensity}% (${intensityDesc})
      
      INSTRUCTIONS:
      - Match the partner's energy but nudge it towards the selected Vibe.
      - Keep it authentic to a human conversation (lowercase where appropriate, casual punctuation).
      - Do not sound like a robot.
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
 * Generates a reaction image / visual aid based on the context.
 * Uses gemini-2.5-flash-image for generation.
 */
export const generateReactionImage = async (
    analysis: ChatAnalysis
): Promise<string> => {
    try {
        // Simplified prompt to avoid safety filters and ensure image output
        const prompt = `A high quality 3D render of a cute round emoji character expressing "${analysis.partnerStyle}". Digital art, sticker style, white background, expressive face.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            // Important: No responseMimeType or Schema for image models
        });

        // Extract image
        let base64Image = "";
        let textFallback = "";
        
        if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    break;
                } else if (part.text) {
                    textFallback = part.text;
                }
            }
        }

        if (!base64Image) {
             console.warn("Gemini returned text instead of image:", textFallback);
             throw new Error("The AI declined to generate an image for this context. Try a different vibe.");
        }
        
        return base64Image;

    } catch (error) {
        console.error("Image Gen Error", error);
        throw error;
    }
}

/**
 * Handles the "Ask the Coach" chat functionality.
 */
export const askRelationshipCoach = async (
  files: File[],
  textContext: string,
  language: string,
  history: { role: 'user' | 'model', text: string }[],
  question: string
): Promise<string> => {
  try {
    const fileParts = await Promise.all(files.map(fileToPart));

    // Construct the full history for the API
    // We inject the files into the very first turn to provide context
    const contents = [];

    // System instruction equivalent + Context
    const systemPart = {
      text: `
        You are an expert Relationship Coach and Communication Specialist.
        Your goal is to help the user understand the conversation context provided (files/text) and navigate their relationship dynamics.
        
        CONTEXT PROVIDED:
        - Files: Screenshots/Recordings of the conversation.
        - Text Note: ${textContext || "None"}
        - Language: ${language || "Detect from files"}
        
        INSTRUCTIONS:
        - Answer the user's questions about the partner's intent, meaning, or hidden subtext.
        - Be empathetic but realistic. Don't give false hope, but don't be cruel.
        - Keep answers concise (under 150 words) unless asked for details.
        - If the user asks for a specific reply, suggest one but explain the 'why'.
      `
    };

    // If this is the first message in the session (history is empty), we bundle files with the question
    if (history.length === 0) {
      contents.push({
        role: 'user',
        parts: [
          ...fileParts,
          systemPart,
          { text: question }
        ]
      });
    } else {
      // Reconstruct history
      // Note: We can't easily resend files in every stateless request without bandwidth cost, 
      // but for a robust specialized chat, we often need the files in the context.
      // Strategy: Send files in the first turn of THIS request structure.
      
      // We will actually rebuild the turns. 
      // Turn 1 (User): [Files, System Context, First User Query]
      // Turn 1 (Model): [First Model Response]
      // ...
      // Turn N (User): [Current Question]
      
      // Since we don't have the files from previous 'history' text objects, we assume 
      // we must re-inject them at the start of the conversation window for the model to "see" them again 
      // in this stateless request (or use a stateful chat session, but here we use generateContent for simplicity with fileParts).
      
      // Map existing history
      const historyParts = history.map((msg, index) => {
        if (index === 0 && msg.role === 'user') {
             // Inject files into the FIRST user message recorded in history
             return {
                 role: 'user',
                 parts: [...fileParts, systemPart, { text: msg.text }]
             };
        }
        return {
            role: msg.role,
            parts: [{ text: msg.text }]
        };
      });
      
      contents.push(...historyParts);
      
      // Add current question
      contents.push({
        role: 'user',
        parts: [{ text: question }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro model for reasoning about text/images
      contents: contents,
    });

    return response.text || "I couldn't quite analyze that. Could you rephrase?";

  } catch (error) {
    console.error("Coach Chat Error:", error);
    return "I'm having a little trouble connecting to my intuition right now. Please try again in a moment.";
  }
};