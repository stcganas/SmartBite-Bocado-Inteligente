import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
config();
function getAI() {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}
async function test() {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hello",
      config: { responseMimeType: "application/json" }
    });
    console.log("SUCCESS:", response.text);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}
test();
