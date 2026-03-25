import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GeneratedMedicalRecord {
  summary: string;
  clinicalObservations: string;
  evolution: string;
  nextSessionPlan: string;
}

export async function generateMedicalRecord(rawNotes: string): Promise<GeneratedMedicalRecord> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Você é um assistente especializado para psicólogos. 
    Transforme as seguintes anotações brutas de uma sessão de terapia em um prontuário estruturado e profissional.
    
    Anotações:
    "${rawNotes}"
    
    Retorne o resultado estritamente no formato JSON com as seguintes chaves:
    - summary: Resumo da sessão.
    - clinicalObservations: Observações clínicas relevantes.
    - evolution: Evolução do paciente.
    - nextSessionPlan: Plano para a próxima sessão.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            clinicalObservations: { type: Type.STRING },
            evolution: { type: Type.STRING },
            nextSessionPlan: { type: Type.STRING },
          },
          required: ["summary", "clinicalObservations", "evolution", "nextSessionPlan"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as GeneratedMedicalRecord;
  } catch (error) {
    console.error("Error generating medical record:", error);
    throw new Error("Falha ao gerar prontuário com IA.");
  }
}

export interface PlaceSuggestion {
  title: string;
  address: string;
  uri: string;
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!query || query.length < 3) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find the address and details for: ${query}`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const suggestions: PlaceSuggestion[] = chunks
      .filter(chunk => chunk.maps)
      .map(chunk => ({
        title: chunk.maps!.title || "",
        address: chunk.maps!.title || "", // The title often contains the address or name
        uri: chunk.maps!.uri || ""
      }));

    return suggestions;
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}
