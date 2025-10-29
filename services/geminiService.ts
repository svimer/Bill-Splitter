
import { GoogleGenAI, Type } from "@google/genai";
import type { ReceiptItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: "A list of all items found on the receipt.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description: "The name or description of the item.",
          },
          quantity: {
            type: Type.INTEGER,
            description: "The quantity of the item. Defaults to 1 if not specified.",
          },
          price: {
            type: Type.NUMBER,
            description: "The total price for the item line (quantity * unit price).",
          },
        },
        required: ["description", "quantity", "price"],
      },
    },
  },
  required: ["items"],
};


export const parseReceipt = async (imageBase64: string): Promise<Omit<ReceiptItem, 'id'>[]> => {
  const prompt = `Analyze this receipt image. Extract all line items, ignoring taxes, totals, or discounts. For each item, provide its description, quantity, and total price. Respond ONLY with a JSON object that matches the provided schema. If a quantity is not explicitly mentioned for an item, assume it is 1. Ensure prices are numeric values.`;

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: imageBase64,
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });
    
    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    
    if (parsedJson && Array.isArray(parsedJson.items)) {
        // Filter out any items that are likely totals or taxes
        return parsedJson.items.filter((item: any) => {
            const desc = item.description.toLowerCase();
            return !desc.includes('total') && !desc.includes('tax') && !desc.includes('subtotal') && !desc.includes('cash') && !desc.includes('change');
        });
    }

    return [];

  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    throw new Error("The AI model could not process the receipt image.");
  }
};
