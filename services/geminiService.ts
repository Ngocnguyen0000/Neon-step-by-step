
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const isGeminiConfigured = (): boolean => !!API_KEY && API_KEY !== 'YOUR_KEY_HERE';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    svgString: {
      type: Type.STRING,
      description: "The full SVG XML string containing the line art. It must have a viewBox attribute. Each logical drawing stroke must be its own <path> element with a black stroke, a transparent fill, and a consistent stroke-width.",
    },
  },
  required: ["svgString"],
};

export const generateDrawingSgv = async (prompt: string): Promise<string | null> => {
  try {
    if (!API_KEY || API_KEY === 'YOUR_KEY_HERE') {
      throw new Error("Gemini API key is missing on this deployment. Set GEMINI_API_KEY in your Vercel project settings and redeploy.");
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a simple, single-color, black-and-white line art drawing of "${prompt}" suitable for a step-by-step drawing tutorial.
The output must be a valid SVG.
Crucially, each logical drawing stroke must be a separate <path> element.
Do not use <circle>, <rect>, <line>, or other shapes; use only <path> elements.
The SVG must have a viewBox attribute and no fixed width or height attributes.
All paths must have a stroke of '#000000', a transparent or 'none' fill, and a consistent stroke-width (e.g., '2' or '5').`,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    });

    const jsonString = result.text;
    if (!jsonString) {
      console.error("Gemini API returned an empty response.");
      return null;
    }

    const parsed = JSON.parse(jsonString);
    return parsed.svgString || null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate drawing. The AI may be experiencing issues.");
  }
};
