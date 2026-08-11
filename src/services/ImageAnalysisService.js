import { GoogleGenAI } from "@google/genai";

class ImageAnalysisService {
  constructor() {
    const apiKey = import.meta.env.VITE_VISION_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn("[VISION_API] VITE_VISION_API_KEY is missing. Real image analysis will fail.");
    }
  }

  async fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async validateImage(file, selectedCategory) {
    if (!file) return null;

    if (!this.ai) {
      // Fail explicitly as per requirement (no generic fallback success)
      return {
        valid: false,
        relevant: false,
        reason: "Image analysis is currently unavailable. Please provide a valid Vision API key.",
      };
    }

    try {
      console.log("=== VISION ANALYSIS STARTED ===");
      console.log("API KEY CONFIGURED:", !!import.meta.env.VITE_VISION_API_KEY);
      console.log("MODEL:", "gemini-3.5-flash-lite");
      console.log("IMAGE MIME TYPE:", file.type);
      console.log("IMAGE SIZE:", file.size);
      console.log("REQUEST STARTED...");

      const imagePart = await this.fileToGenerativePart(file);

      const prompt = `Analyze this image for civic issues. Determine if it shows a legitimate civic/public issue (e.g. pothole, garbage, water leakage, broken streetlight, electricity infrastructure, drainage, etc.).
If it is a completely unrelated image (like a movie poster, a random selfie, advertisement, or a landscape photograph without issues), mark it as irrelevant.

If the image is a valid civic issue, categorize it appropriately. If the user has pre-selected the category "${selectedCategory || 'Unknown'}", check if the image matches this category. If it's a completely different civic issue (e.g., user selected 'Water Leakage' but the image is a 'Pothole'), mark is_relevant as false.

You MUST return a VALID JSON object strictly in this exact format. Ensure ALL keys are double-quoted strings (e.g. "is_civic_issue") and boolean values are true/false without quotes:
{
  "is_civic_issue": boolean,
  "is_relevant": boolean,
  "category": "String (e.g. Road Damage/Pothole) or null",
  "severity": "String (e.g. High, Medium, Low) or null",
  "department": "String (e.g. Public Works) or null",
  "confidence": number (0.0 to 1.0),
  "reason": "String explaining the decision"
}`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              imagePart
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const responseText = response.text;
      let cleanedText = responseText.trim();
      
      // Remove markdown JSON code blocks if present
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      }
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("Invalid response format from Vision API: JSON parsing failed");
      }

      // Validate schema precisely
      if (
        typeof parsedResult !== "object" ||
        parsedResult === null ||
        typeof parsedResult.is_civic_issue !== "boolean" ||
        typeof parsedResult.is_relevant !== "boolean" ||
        typeof parsedResult.confidence !== "number" ||
        typeof parsedResult.reason !== "string"
      ) {
        console.error("Schema validation failed:", parsedResult);
        throw new Error("Invalid response schema from Vision API: Missing or incorrect types");
      }

      console.log("REQUEST SUCCESS", parsedResult);

      if (!parsedResult.is_civic_issue || !parsedResult.is_relevant) {
          return {
              valid: false,
              relevant: false,
              reason: parsedResult.reason || "This image does not appear relevant to the selected complaint.",
              confidence: parsedResult.confidence || 0
          };
      }

      return {
        valid: true,
        relevant: true,
        category: parsedResult.category,
        detected_category: parsedResult.category,
        label: parsedResult.category,
        confidence: parsedResult.confidence,
        severity: parsedResult.severity,
        department: parsedResult.department,
        reason: parsedResult.reason,
      };
    } catch (err) {
      console.log("REQUEST FAILED");
      console.error("ERROR:", err.message || err);
      // Fail gracefully
      return {
        valid: false,
        relevant: false,
        reason: "Image analysis is currently unavailable. Please try again.",
      };
    }
  }
}

export const imageAnalysisService = new ImageAnalysisService();
