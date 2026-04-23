import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SOPGenerationParams {
  title: string;
  guideText: string;
  guidelines: string[];
  additionalDetails?: string;
  version: number;
}

export async function generateSOP({ title, guideText, guidelines, additionalDetails, version }: SOPGenerationParams) {
  const prompt = `You are a professional Laboratory Quality Manager expert in international accreditation standards like ISO 15189, CAP (College of American Pathologists), NABL (National Accreditation Board for Testing and Calibration Laboratories), and GxP/EHR guidelines.

Task: Generate a comprehensive Standard Operating Procedure (SOP) for the following laboratory process.

Details:
- SOP Title: ${title}
- Target Version: ${version}
- Applicable Guidelines: ${guidelines.join(', ')}
- Source/Guide Material: ${guideText}
- Additional User Constraints: ${additionalDetails || 'None'}

The SOP MUST include the following sections:
1. Header: (Title, Document ID, Version, Effective Date, Page X of Y)
2. Purpose/Scope
3. Responsibilities
4. Prerequisites (Safety, PPE, Equipment, Reagents)
5. Procedure (Highly detailed, step-by-step)
6. Quality Control / Quality Assurance
7. Troubleshooting
8. References
9. Revision History Table

Output Format: Markdown. Use professional, clear, and regulatory-compliant language. Ensure it follows specific requirements of the selected guidelines (e.g., ISO 15189 requires specific risk management and QC mentions).

Generate the complete SOP now.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview", // Complex task requires pro model
    contents: prompt,
    config: {
      temperature: 0.2, // Lower temperature for technical writing
    }
  });

  return response.text;
}
