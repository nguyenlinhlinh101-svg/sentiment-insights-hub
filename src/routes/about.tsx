import { createFileRoute } from "@tanstack/react-router";
import { Brain, Cpu, Code2, Network, Database, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "Project Overview — SentimentAI" },
      { name: "description", content: "A Data Science deployment bridging frontend React with a Hugging Face NLP model via API." },
    ],
  }),
});

function Stat({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="mt-2 text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div
        className="rounded-2xl border p-8 shadow-sm"
        style={{ background: "var(--gradient-primary)", color: "white" }}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Data Science Deployment
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Project Overview</h1>
        <p className="mt-3 max-w-2xl text-white/90">
          SentimentAI is a full end-to-end Data Science project that brings a state-of-the-art
          Natural Language Processing model directly to end users through a polished web interface.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Stat
          icon={Brain}
          title="NLP at the core"
          body="Uses DistilBERT fine-tuned on SST-2, a Transformer-based model trained for binary sentiment classification on the Stanford Sentiment Treebank."
        />
        <Stat
          icon={Network}
          title="Model served via API"
          body="The model is hosted on the Hugging Face Inference API. The frontend sends raw text and receives back JSON predictions in real time."
        />
        <Stat
          icon={Code2}
          title="React + Tailwind frontend"
          body="A modern TanStack Start + Tailwind CSS interface handles input, validation, charts, and a responsive Data Science dashboard."
        />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Architecture</CardTitle>
          <CardDescription>
            How the pieces fit together — from user input to ML inference and back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <span>
                <strong>User input</strong> — a single comment or a CSV/Excel file of reviews is
                provided through the React frontend.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <span>
                <strong>Preprocessing</strong> — files are parsed with PapaParse / SheetJS in the
                browser to extract the text column.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <span>
                <strong>ML inference</strong> — each text is POSTed to the Hugging Face Inference
                API endpoint for <code>distilbert-base-uncased-finetuned-sst-2-english</code>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </span>
              <span>
                <strong>Visualization</strong> — predictions are rendered with confidence bars,
                and aggregated into Recharts pie and bar charts for the batch dashboard.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Stat
          icon={Cpu}
          title="Machine Learning"
          body="DistilBERT is a distilled version of BERT — smaller, faster, and 97% as accurate. It outputs probabilities over POSITIVE and NEGATIVE classes."
        />
        <Stat
          icon={Database}
          title="Batch analytics"
          body="The dashboard aggregates per-row predictions into distribution charts, demonstrating how a single ML model scales across a dataset."
        />
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Built as a Data Science deployment showcase · React · Tailwind · Hugging Face · Recharts
      </p>
    </div>
  );
}