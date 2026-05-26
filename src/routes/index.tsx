import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { analyzeSentiment, type SentimentResult } from "@/lib/sentiment";

export const Route = createFileRoute("/")({
  component: SinglePage,
  head: () => ({
    meta: [
      { title: "Single Text Analysis — SentimentAI" },
      { name: "description", content: "Analyze the sentiment of any text in real time using a Hugging Face NLP model." },
    ],
  }),
});

function SinglePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SentimentResult | null>(null);

  const onAnalyze = async () => {
    setError(null);
    if (!text.trim()) {
      setError("Please enter some text before analyzing.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await analyzeSentiment(text.trim());
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isPositive = result?.label === "POSITIVE";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border bg-accent/50 px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by DistilBERT · Hugging Face
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Single Text Analysis</h1>
        <p className="mt-2 text-muted-foreground">
          Paste any customer review, tweet, or comment to detect its sentiment in real time.
        </p>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle>Your text</CardTitle>
          <CardDescription>The model classifies input as POSITIVE or NEGATIVE.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. The product quality is amazing and the delivery was super fast!"
            className="min-h-40 resize-y text-base"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length} characters</span>
            <Button onClick={onAnalyze} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">The neural network is thinking…</p>
        </div>
      )}

      {result && !loading && (
        <Card
          className="mt-6 border-2"
          style={{
            borderColor: isPositive ? "var(--success)" : "var(--destructive)",
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardDescription>Predicted sentiment</CardDescription>
                <CardTitle
                  className="mt-1 text-3xl"
                  style={{ color: isPositive ? "var(--success)" : "var(--destructive)" }}
                >
                  {isPositive ? "POSITIVE 😀" : "NEGATIVE 😞"}
                </CardTitle>
              </div>
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  backgroundColor: isPositive ? "var(--success)" : "var(--destructive)",
                  color: "white",
                }}
              >
                {isPositive ? <ThumbsUp className="h-8 w-8" /> : <ThumbsDown className="h-8 w-8" />}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-semibold">{(result.score * 100).toFixed(2)}%</span>
            </div>
            <Progress value={result.score * 100} className="h-3" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
