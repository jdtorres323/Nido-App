import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("Gemini API Key defined:", !!API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateFinancialInsights = async (expenses, householdName) => {
  if (!expenses || expenses.length === 0) return null;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Eres un experto en finanzas personales y economía doméstica para la aplicación "Nido".
    Analiza los siguientes gastos del hogar "${householdName}" y proporciona 3 sugerencias accionables y reales.
    
    Los gastos son:
    ${JSON.stringify(expenses.map(e => ({ concept: e.concept, amount: e.totalAmount, category: e.category, date: e.processedDate })))}

    Devuelve ÚNICAMENTE un objeto JSON con el siguiente formato, sin markdown, sin texto adicional:
    {
      "insights": [
        {
          "type": "energy" | "subscriptions" | "savings" | "general",
          "title": "Título corto",
          "description": "Descripción detallada con datos reales basados en los gastos",
          "actionText": "Texto del botón de acción",
          "icon": "nombre_icono_material_symbols"
        }
      ]
    }

    Reglas:
    1. Si detectas gastos duplicados en servicios de streaming o similares, menciónalo.
    2. Si los gastos en servicios (luz, agua) son altos, da consejos de ahorro energético.
    3. Si hay una tendencia positiva de ahorro, felicita al usuario.
    4. Usa un tono cercano, premium y motivador.
    5. Los montos deben estar en la moneda que se ve en los datos (usualmente UYU o pesos).
  `;

  console.log("AI Prompt:", prompt);
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Raw AI Response:", text);
    
    // Extract JSON from potential markdown or surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response");
      return null;
    }
    
    const cleanedText = jsonMatch[0].trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return null;
  }
};

const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const aiService = {
  analyzeReceipt: async (files) => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analiza estas imágenes de un ticket o recibo de compra. (Pueden ser partes de la misma factura larga).
      Extrae la siguiente información y devuélvela ÚNICAMENTE en formato JSON:
      {
        "concept": "Nombre del establecimiento o comercio principal",
        "date": "YYYY-MM-DD",
        "items": [
          {
            "concept": "Nombre del producto (ej: Whisky Escocés)",
            "amount": 749.00 (solo el número),
            "category": "comida" | "hogar" | "ocio" | "otros" | "servicios"
          }
        ]
      }
      
      Reglas:
      1. Si no puedes determinar la fecha, usa la fecha actual.
      2. Si no puedes determinar la categoría de un ítem, usa "otros".
      3. Extrae CADA producto individual como un ítem separado en el array "items".
    `;

    try {
      const fileArray = Array.isArray(files) ? files : [files];
      const imageParts = await Promise.all(fileArray.map(fileToGenerativePart));
      
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      const cleanedText = text.replace(/```json|```/gi, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Error analyzing receipt with Gemini:", error);
      throw error;
    }
  }
};
