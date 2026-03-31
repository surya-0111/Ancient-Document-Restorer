import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
// Note: In this environment, GEMINI_API_KEY is provided in the environment.
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const restoreManuscript = async (imageBuffer: string) => {
  const model = "gemini-3.1-pro-preview";
  const ai = genAI;

  const prompt = `
    You are an expert paleographer and ancient document restorer. 
    Analyze the provided image of an ancient manuscript. 
    1. Perform OCR to extract the text.
    2. Use your knowledge of historical linguistics to restore missing or damaged parts.
    3. Estimate the historical era.
    4. Provide a confidence score for the restoration.
    5. Identify uncertain words.

    Return the result in JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBuffer,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          restoredText: { type: Type.STRING },
          era: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          uncertainWords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
          },
        },
        required: ["restoredText", "era", "confidence"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const scribeChat = async (query: string, history: any[], restorationResult?: any) => {
  const model = "gemini-3.1-pro-preview";
  const ai = genAI;

  const systemInstruction = `
    You are "The Scribe", an expert in paleography, ink analysis, and historical document restoration. 
    You are helpful, scholarly, and speak with a touch of archaic elegance.
    Answer questions about the manuscript being restored or general paleography.
    Use the provided restoration result and chat history to provide context-aware responses.
  `;

  const contextStr = restorationResult ? `Current Manuscript Restoration: ${JSON.stringify(restorationResult)}` : "No specific manuscript context provided.";
  const historyStr = history.map(h => `${h.role}: ${h.text}`).join("\n");

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: `Context: ${contextStr}` },
          { text: `History: ${historyStr}` },
          { text: `User Query: ${query}` },
        ],
      },
    ],
    config: {
      systemInstruction,
    },
  });

  return response.text;
};
