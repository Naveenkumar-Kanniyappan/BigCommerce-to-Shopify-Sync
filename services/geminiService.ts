import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const explainStep = async (stepName: string, context: string): Promise<{ text: string }> => {
  if (!process.env.API_KEY) {
    return { text: "API Key is missing. Please configure the environment variable." };
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are a technical solutions architect explaining an automated data sync workflow between BigCommerce (Source) and Shopify (Destination). Explain the technical implications, API considerations (rate limits, status codes), and data mapping logic concisely.",
      },
      contents: `
        Task: Explain a step in the 'BigCommerce to Shopify Customer Sync' workflow.
        
        Step Name: "${stepName}"
        Technical Description: ${context}
        
        Please provide:
        1. What is technically happening here (1-2 sentences).
        2. A 'Pro Tip' or potential pitfall (e.g., API limits, data formatting issues).
        
        Keep it professional, concise, and helpful for a developer. Plain text only.
      `
    });

    return { text: result.text || "" };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Unable to generate explanation at this time." };
  }
};