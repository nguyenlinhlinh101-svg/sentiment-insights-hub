export type SentimentLabel = "POSITIVE" | "NEGATIVE" | "NEUTRAL";
export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  source: string;
}

const HF_URL =
  "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english";

// @ts-expect-error – sentiment has no type declarations
import Sentiment from "sentiment";
const sentimentAnalyzer = new Sentiment();

/**
 * Maps a raw sentiment integer score to a [0, 1] confidence value.
 * Uses a sigmoid-like clamp: each point of score adds ~5% confidence
 * above the 50% baseline, capped at 99%.
 */
function scoreToConfidence(rawScore: number): number {
  const abs = Math.abs(rawScore);
  const confidence = 0.5 + Math.min(abs * 0.05, 0.49);
  return Math.round(confidence * 100) / 100;
}

function runFallbackLexicon(text: string): SentimentResult {
  const words = text.toLowerCase().split(/[\s,.\/#!$%\^&\*;:{}=\-_`~()?]+/).filter(Boolean);
  const negationWords = ["don't", "dont", "not", "never", "no", "cant", "can't", "wasn't", "isnt", "isn't"];

  const negationIndex = words.findIndex((w) => negationWords.includes(w));
  const result = sentimentAnalyzer.analyze(text);
  let finalScore = result.score;

  if (negationIndex !== -1) {
    const wordsAfterNegation = words.slice(negationIndex + 1);
    const hasPositiveAfter = wordsAfterNegation.some((word) => {
      const wordAnalysis = sentimentAnalyzer.analyze(word);
      return wordAnalysis.score > 0;
    });

    if (hasPositiveAfter) {
      finalScore = -finalScore;
    }
  }

  if (finalScore > 0) {
    return {
      label: "POSITIVE",
      score: scoreToConfidence(finalScore),
      source: "(Local Fallback)",
    };
  }
  if (finalScore < 0) {
    return {
      label: "NEGATIVE",
      score: scoreToConfidence(finalScore),
      source: "(Local Fallback)",
    };
  }
  // score === 0 → truly neutral
  return { label: "NEUTRAL", score: 0.5, source: "(Local Fallback)" };
}

async function analyzeSentimentLocal(text: string): Promise<SentimentResult> {
  try {
    const res = await fetch("http://localhost:8000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();
    const label = data.label as SentimentLabel;
    const rawScore = data.score as number; // 1.0 to 5.0

    // Map 1.0 - 5.0 continuous score to a [0.5, 1.0] confidence value
    let score = 0.5;
    if (label === "POSITIVE") {
      score = 0.5 + ((rawScore - 3.5) / 1.5) * 0.5;
    } else if (label === "NEGATIVE") {
      score = 0.5 + ((2.5 - rawScore) / 1.5) * 0.5;
    }
    score = Math.round(score * 100) / 100;

    return {
      label,
      score,
      source: "(Linear Regression Model)",
    };
  } catch (e) {
    console.warn("Python ML server request failed in analyzeSentimentLocal, falling back to basic lexicon-based prediction", e);
    return runFallbackLexicon(text);
  }
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
      return await analyzeSentimentLocal(text);
    }
    const data = await res.json();
    // Response shape: [[{label, score}, {label, score}]]
    const arr = Array.isArray(data?.[0]) ? data[0] : data;
    if (!Array.isArray(arr) || !arr.length) {
      console.warn("Unexpected API response format, falling back to local");
      return await analyzeSentimentLocal(text);
    }
    const top = arr.reduce((a: any, b: any) => (a.score > b.score ? a : b));
    
    // Map standard labels to POSITIVE or NEGATIVE
    const rawLabel = (top.label as string).toUpperCase();
    const mappedLabel: SentimentLabel = rawLabel.includes("POS") ? "POSITIVE" : "NEGATIVE";
    
    return { 
      label: mappedLabel, 
      score: top.score as number, 
      source: "(Live API)" 
    };
  } catch (e) {
    console.warn("Network or unexpected error, falling back to local sentiment", e);
    return await analyzeSentimentLocal(text);
  }
}
