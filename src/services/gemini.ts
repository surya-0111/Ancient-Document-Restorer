import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const analyzeManuscript = async (imageBase64: string, prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { 
              inlineData: { 
                mimeType: "image/jpeg", 
                data: imageBase64 
              } 
            }
          ]
        }
      ],
      config: {
        systemInstruction: "You are an expert paleographer and manuscript restoration specialist. Analyze the provided manuscript image and suggest restoration steps or transcribe degraded text.",
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing manuscript:", error);
    return "Analysis failed. Please check your connection and API key.";
  }
};
