// services/ocr.ts
import * as FileSystem from 'expo-file-system';
import { EXPENSE_CATEGORIES } from '@/features/transactions/constants';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// What we expect back from parsing
export type ParsedReceipt = {
    amount: string;
    category: string;
    description: string;
    date: string;
};

export async function parseReceiptImage(
    imageUri: string
): Promise<{ data: ParsedReceipt | null; error: string | null }> {
    try {
        // SDK 54+ way: Use File API to get base64
        const file = new FileSystem.File(imageUri);
        const base64Image = await file.base64();

        // Build the prompt
        const prompt = `Analyze this receipt image and extract the following information.
Return ONLY a valid JSON object with these exact fields:
{
    "amount": "total amount as a number string (e.g., '25.99')",
    "category": "one of: ${EXPENSE_CATEGORIES.join(', ')}",
    "description": "brief description of the purchase (store name + main items)",
    "date": "date in YYYY-MM-DD format (use today if not visible)"
}

Rules:
- For amount, use the TOTAL or final amount paid
- For category, pick the most appropriate from the list
- For description, keep it short (e.g., "Starbucks - Coffee")
- For date, extract from receipt or use today's date: ${new Date().toISOString().split('T')[0]}

Return ONLY the JSON object, no other text.`;

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/jpeg',
                                    data: base64Image,
                                },
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Gemini API request failed');
        }

        const result = await response.json();

        // Extract text from Gemini response
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('No response from Gemini');
        }

        // Parse the JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not parse receipt data');
        }

        const parsed: ParsedReceipt = JSON.parse(jsonMatch[0]);

        // Validate category
        if (!EXPENSE_CATEGORIES.includes(parsed.category as any)) {
            parsed.category = 'Other';
        }

        return { data: parsed, error: null };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse receipt';
        console.error('OCR error:', message);
        return { data: null, error: message };
    }
}
