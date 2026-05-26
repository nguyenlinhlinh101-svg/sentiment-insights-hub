export type SentimentLabel = "POSITIVE" | "NEGATIVE";
export interface SentimentResult {
  label: SentimentLabel;
  score: number;
}

const HF_URL =
  "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const res = await fetch(HF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Hugging Face API error (${res.status}): ${msg.slice(0, 200)}`);
  }
  const data = await res.json();
  // Response shape: [[{label, score}, {label, score}]]
  const arr = Array.isArray(data?.[0]) ? data[0] : data;
  if (!Array.isArray(arr) || !arr.length) throw new Error("Unexpected API response");
  const top = arr.reduce((a: any, b: any) => (a.score > b.score ? a : b));
  return { label: top.label as SentimentLabel, score: top.score as number };
}