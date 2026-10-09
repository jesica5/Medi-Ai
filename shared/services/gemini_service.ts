import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiAnalysisInput {
  chiefComplaint: string;
  symptomVector: Record<string, any>;
  vitals: Record<string, any>;
  calculatedScore: number;
  calculatedCategory: string;
  topFeatures: any[];
}

export class GeminiService {
  /**
   * Server-side Google Gemini AI integration for clinical symptom analysis
   * Reads process.env.GEMINI_API_KEY strictly on the server side.
   */
  public static async generateClinicalExplanation(input: GeminiAnalysisInput): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Security Guard: Ensure GEMINI_API_KEY is not executed in client bundle
    if (typeof window !== 'undefined') {
      throw new Error('SECURITY VIOLATION: Gemini API key must never be invoked from client code.');
    }

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey === 'your_gemini_api_key_here') {
      // Clean fallback when GEMINI_API_KEY is not configured
      return `AI Symptom Analysis (Gemini Fallback): Primary drivers indicate elevated physiological strain (${input.calculatedCategory} risk category, ${input.calculatedScore}/100 score). Prompt clinical evaluation recommended.`;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Act as an emergency triage clinical decision-support AI assistant.
Analyze the following de-identified patient triage data:
Chief Complaint: "${input.chiefComplaint}"
Vitals: ${JSON.stringify(input.vitals)}
Calculated ML Risk Score: ${input.calculatedScore}/100 (${input.calculatedCategory})
Top TreeSHAP Risk Drivers: ${JSON.stringify(input.topFeatures)}

Provide a concise, 2-3 sentence clinical symptom analysis and decision-support summary for attending clinicians.
Do NOT make a definitive medical diagnosis or recommend drug dosages. Focus on urgency and triage rationale.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text ? text.trim() : `Gemini Analysis: Evaluated ${input.calculatedCategory} risk category (${input.calculatedScore}/100 score). Direct clinical assessment required.`;
    } catch (error: any) {
      console.warn('[Gemini API Server Warning]:', error?.message || error);
      return `AI Symptom Analysis: Calculated ${input.calculatedCategory} risk category (${input.calculatedScore}/100 score). Top drivers: ${input.topFeatures.map((f: any) => f.feature_name).join(', ')}.`;
    }
  }
}
