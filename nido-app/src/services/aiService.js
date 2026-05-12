import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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

const receiptSchema = {
  type: SchemaType.OBJECT,
  properties: {
    concept: { type: SchemaType.STRING, description: "Nombre del supermercado o comercio principal" },
    date: { type: SchemaType.STRING, description: "Fecha de la compra (YYYY-MM-DD)" },
    items: {
      type: SchemaType.ARRAY,
      description: "Lista exhaustiva de todos y cada uno de los productos del ticket. PROHIBIDO resumir.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING, description: "Nombre del producto limpio (sin códigos)" },
          amount: { type: SchemaType.NUMBER, description: "Precio final pagado por el producto. ¡IMPORTANTE! Si el ítem siguiente dice 'Descuento', RESTA ese monto a este valor. Ejemplo: Producto 100, Descuento 20 -> extrae 80." },
          category: { type: SchemaType.STRING, enum: ["comida", "hogar", "ocio", "otros", "servicios"], description: "Categoría lógica del producto." }
        },
        required: ["concept", "amount", "category"]
      }
    }
  },
  required: ["concept", "date", "items"]
};

export const aiService = {
  analyzeReceipt: async (files) => {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "Eres un analista experto que transcribe tickets de supermercado extremadamente largos de fotos. Extrae TODOS Y CADA UNO de los ítems. Tienes PROHIBIDO agrupar o resumir productos por cansancio. REGLA CLAVE: Toma el precio TOTAL de cada ítem, no el unitario. Si ves una línea que dice 'Descuento' debajo de un producto, tienes que RESTAR ese monto del importe total del producto de arriba y guardar el resultado final en 'amount'. Retorna solo datos estructurados.",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      }
    });

    const prompt = `Analiza estas imágenes de un ticket de compra continuo y extrae todos los productos. Si no encuentras fecha en las fotos, utiliza la fecha actual: ${new Date().toISOString().split('T')[0]}`;

    try {
      const fileArray = Array.isArray(files) ? files : [files];
      const imageParts = await Promise.all(fileArray.map(fileToGenerativePart));
      
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      // Con responseMimeType y responseSchema, Gemini devuelve texto 100% JSON validado sin backticks.
      const text = response.text();
      console.log("Structured AI Response:", text);
      
      return JSON.parse(text);
    } catch (error) {
      console.error("Error analyzing receipt with Gemini:", error);
      throw error;
    }
  }
};
