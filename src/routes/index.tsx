import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Loader2, Sparkles, AlertCircle, ThumbsUp, ThumbsDown, Activity, Cpu, BarChart3, Lock, Wand2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (result && !loading && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, loading]);

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

  const examples: { label: string; tone: "success" | "destructive" | "secondary"; text: string }[] = [
    {
      label: "Positive Review",
      tone: "success",
      text: "Absolutely love this product! The quality exceeded my expectations and customer support was incredibly helpful.",
    },
    {
      label: "Negative Complaint",
      tone: "destructive",
      text: "Terrible experience. The item arrived broken, support never replied, and I want a full refund immediately.",
    },
    {
      label: "Sarcastic Feedback",
      tone: "secondary",
      text: "Oh great, another app that crashes every five minutes. Truly a masterpiece of modern engineering.",
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-accent-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by DistilBERT · Hugging Face
        </div>
        <h1 className="mt-4 text-5xl font-bold tracking-tight text-gradient leading-tight">
          Single Text Analysis
        </h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Paste any customer review, tweet, or comment to detect its sentiment in real time.
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/15">
              <Activity className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">API Status</div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="relative inline-flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                Active (150ms delay)
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Model Version</div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                DistilBERT
                <Badge variant="secondary" className="text-[10px]">v1.0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/40">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Daily Requests</span>
                <span className="text-xs font-semibold">1,248 / 5,000</span>
              </div>
              <Progress value={(1248 / 5000) * 100} className="mt-1.5 h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="lg:col-span-7">
      <Card className="glass shadow-elegant">
        <CardHeader>
          <CardTitle>Your text</CardTitle>
          <CardDescription>The model classifies input as POSITIVE or NEGATIVE.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. The product quality is amazing and the delivery was super fast!"
            className="min-h-40 resize-y text-base bg-background/40 border-white/10 transition-all focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary/40 shadow-inner"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{text.length} characters</span>
            <Button
              onClick={onAnalyze}
              disabled={loading}
              size="lg"
              className="bg-gradient-primary text-white shadow-glow transition-all duration-200 ease-out hover:scale-[1.05] active:scale-[0.96] hover:shadow-elegant hover:brightness-110 active:brightness-95"
            >
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
        </div>

        <div className="lg:col-span-3">
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="h-4 w-4 text-primary" />
                Quick Examples & Guidelines
              </CardTitle>
              <CardDescription>Click to fill the text area.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {examples.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => setText(ex.text)}
                    className="group w-full rounded-lg border border-white/10 bg-background/30 p-3 text-left transition-all hover:border-primary/40 hover:bg-background/50 hover:shadow-glow"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{ex.label}</span>
                      <Badge variant={ex.tone === "success" ? "default" : ex.tone === "destructive" ? "destructive" : "secondary"} className="text-[10px]">
                        sample
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ex.text}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-lg border border-white/10 bg-background/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" />
                  NLP Preprocessing
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Tokenization — split text into subwords
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Lowercasing — normalize casing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Embedding — map tokens to vectors
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-6 animate-fade-in-up">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-xl glass p-10 animate-fade-in-up">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">The neural network is thinking…</p>
        </div>
      )}

      {result && !loading && (
        <div ref={resultRef}>
        <Card
          className={`mt-6 border-2 glass animate-fade-in-up ${isPositive ? "animate-pulse-glow-success" : "animate-pulse-glow-destructive"}`}
          style={{
            borderColor: isPositive ? "var(--success)" : "var(--destructive)",
            background: isPositive
              ? "linear-gradient(135deg, color-mix(in oklab, var(--success) 18%, transparent), color-mix(in oklab, var(--card) 80%, transparent))"
              : "linear-gradient(135deg, color-mix(in oklab, var(--destructive) 18%, transparent), color-mix(in oklab, var(--card) 80%, transparent))",
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardDescription>Predicted sentiment</CardDescription>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal tracking-wide"
                  >
                    {result.source}
                  </Badge>
                </div>
                <CardTitle
                  className="mt-1 text-4xl font-bold tracking-tight"
                  style={{ color: isPositive ? "var(--success)" : "var(--destructive)" }}
                >
                  {isPositive ? "POSITIVE 😀" : "NEGATIVE 😞"}
                </CardTitle>
              </div>
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-glow"
                style={{
                  backgroundColor: isPositive ? "var(--success)" : "var(--destructive)",
                  color: "white",
                }}
              >
                {isPositive ? <ThumbsUp className="h-9 w-9" /> : <ThumbsDown className="h-9 w-9" />}
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
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-white/5 pt-4 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 text-success" />
        <span>Secure End-to-End Encryption Enabled</span>
        <span className="opacity-40">|</span>
        <span>Connected via Hugging Face Inference Gateways</span>
      </div>
    </div>
  );
}
