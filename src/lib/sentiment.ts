export type SentimentLabel = "POSITIVE" | "NEGATIVE";
export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  source: "(Live API)" | "(Local Fallback)";
}

const HF_URL =
  "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";

const POSITIVE_KEYWORDS = ["good", "love", "amazing", "great", "excellent", "best"];
const NEGATIVE_KEYWORDS = ["bad", "terrible", "broken", "hate", "worst", "fail"];

function analyzeSentimentLocal(text: string): SentimentResult {
  const lower = text.toLowerCase();
  const hasPositive = POSITIVE_KEYWORDS.some((k) => lower.includes(k));
  const hasNegative = NEGATIVE_KEYWORDS.some((k) => lower.includes(k));

  if (hasPositive && !hasNegative) {
    return { label: "POSITIVE", score: 0.85, source: "(Local Fallback)" };
  }
  if (hasNegative && !hasPositive) {
    return { label: "NEGATIVE", score: 0.85, source: "(Local Fallback)" };
  }
  // Default fallback when mixed or no keywords
  return { label: "POSITIVE", score: 0.5, source: "(Local Fallback)" };
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    });
    if (!res.ok) {
      const msg = await res.text();
      console.warn(`Hugging Face API error (${res.status}): ${msg.slice(0, 200)}`);
      return analyzeSentimentLocal(text);
    }
    const data = await res.json();
    // Response shape: [[{label, score}, {label, score}]]
    const arr = Array.isArray(data?.[0]) ? data[0] : data;
    if (!Array.isArray(arr) || !arr.length) {
      console.warn("Unexpected API response format, falling back to local");
      return analyzeSentimentLocal(text);
    }
    const top = arr.reduce((a: any, b: any) => (a.score > b.score ? a : b));
    return { label: top.label as SentimentLabel, score: top.score as number, source: "(Live API)" };
  } catch (e) {
    console.warn("Network or unexpected error, falling back to local sentiment", e);
    return analyzeSentimentLocal(text);
  }
}
