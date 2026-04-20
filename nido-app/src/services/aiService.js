import { GoogleGenerativeAI } from "@google/generative-ai";

// Read API Key from environment variables (Vite requires VITE_ prefix)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "PLACEHOLDER");

export const aiService = {
  /**
   * Translates an image file to a structured expense object using Gemini
   */
  async analyzeReceipt(imageFile) {
    if (GEMINI_API_KEY === "TU_API_KEY_AQUI") {
      console.warn("Gemini API Key not configured. Using mock data.");
      return this.getMockData();
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Convert image to generation part
      const imageData = await this.fileToGenerativePart(imageFile);
      
      const prompt = `Analiza este ticket de compra. Extrae el nombre del establecimiento (concept), el importe total (amount) y la fecha (date). 
      Devuelve ÚNICAMENTE un objeto JSON con este formato:
      {
        "concept": "nombre del sitio",
        "amount": 00.00,
        "date": "YYYY-MM-DD",
        "category": "comida" | "hogar" | "ocio" | "otros"
      }
      Básate en el contenido para elegir la categoría más lógica.`;

      const result = await model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response (Gemini sometimes adds markdown blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
    } catch (error) {
      console.error("Error analyzing receipt with Gemini:", error);
      return null;
    }
  },

  async fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: reader.result.split(',')[1],
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  getMockData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          concept: "Supermercado (Mock IA)",
          amount: 24.95,
          date: new Date().toISOString().split('T')[0],
          category: "comida"
        });
      }, 1500);
    });
  }
};

