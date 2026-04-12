import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parsePayslip(base64Data: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Extract the following information from this payslip: Employee Name, DNI or CUIL, and the Month/Year of the payment. Return as JSON."
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          employeeName: { type: Type.STRING },
          dni: { type: Type.STRING },
          period: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ["employeeName", "dni", "period"]
      }
    }
  });

  return JSON.parse(response.text);
}
