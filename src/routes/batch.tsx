import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Upload, Loader2, AlertCircle, Play, FileSpreadsheet } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { analyzeSentiment, type SentimentResult } from "@/lib/sentiment";

export const Route = createFileRoute("/batch")({
  component: BatchPage,
  head: () => ({
    meta: [
      { title: "Batch Dashboard — SentimentAI" },
      { name: "description", content: "Upload CSV or Excel files and visualize sentiment distribution across reviews." },
    ],
  }),
});

interface Row {
  text: string;
  result?: SentimentResult;
  error?: string;
}

function pickTextColumn(rows: Record<string, any>[]): string | null {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]);
  const preferred = ["text", "review", "comment", "feedback", "message", "content"];
  for (const p of preferred) {
    const k = keys.find((k) => k.toLowerCase().trim() === p);
    if (k) return k;
  }
  // pick the first string-ish column
  return keys[0] ?? null;
}

function BatchPage() {
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [textCol, setTextCol] = useState<string>("");
  const [rawPreview, setRawPreview] = useState<Record<string, any>[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setRows([]);
    setRawPreview([]);
    setFileName(file.name);
    try {
      let data: Record<string, any>[] = [];
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, any>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        data = parsed.data;
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }
      if (!data.length) {
        setError("The uploaded file appears to be empty.");
        return;
      }
      const col = pickTextColumn(data);
      if (!col) {
        setError("Could not detect a text column.");
        return;
      }
      setTextCol(col);
      setRawPreview(data);
      const candidate = data
        .map((r) => ({ text: String(r[col] ?? "").trim() }))
        .filter((r) => r.text.length > 0);
      setRows(candidate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file.");
    }
  };

  const runBatch = async () => {
    if (!rows.length) return;
    setProcessing(true);
    setProgress({ done: 0, total: rows.length });
    const updated: Row[] = [...rows];
    for (let i = 0; i < updated.length; i++) {
      try {
        updated[i].result = await analyzeSentiment(updated[i].text);
      } catch (e) {
        updated[i].error = e instanceof Error ? e.message : "error";
      }
      setProgress({ done: i + 1, total: updated.length });
      setRows([...updated]);
    }
    setProcessing(false);
  };

  const counts = rows.reduce(
    (acc, r) => {
      if (r.result?.label === "POSITIVE") acc.positive++;
      else if (r.result?.label === "NEGATIVE") acc.negative++;
      return acc;
    },
    { positive: 0, negative: 0 },
  );
  const totalAnalyzed = counts.positive + counts.negative;

  const pieData = [
    { name: "Positive", value: counts.positive, color: "var(--success)" },
    { name: "Negative", value: counts.negative, color: "var(--destructive)" },
  ];
  const barData = [
    { label: "Positive", count: counts.positive },
    { label: "Negative", count: counts.negative },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight">Batch Analysis Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Upload a CSV or Excel file of reviews and visualize sentiment at scale.
      </p>

      <Card className="mt-6 border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">Drop a .csv or .xlsx file here</p>
          <p className="text-xs text-muted-foreground">
            We'll auto-detect a column named text, review, comment, feedback, message, or content.
          </p>
          <input
            id="file"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button asChild variant="outline">
            <label htmlFor="file" className="cursor-pointer">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Choose file
            </label>
          </Button>
          {fileName && (
            <p className="text-xs text-muted-foreground">
              Loaded: <span className="font-medium text-foreground">{fileName}</span>
              {textCol && <> · column: <code className="rounded bg-muted px-1">{textCol}</code></>}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {rawPreview.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Data preview</CardTitle>
              <CardDescription>
                Showing first 5 of {rawPreview.length} rows · {rows.length} non-empty texts
              </CardDescription>
            </div>
            <Button onClick={runBatch} disabled={processing || !rows.length}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing {progress.done}/{progress.total}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run analysis
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(rawPreview[0]).map((k) => (
                    <TableHead key={k}>{k}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawPreview.slice(0, 5).map((r, i) => (
                  <TableRow key={i}>
                    {Object.keys(rawPreview[0]).map((k) => (
                      <TableCell key={k} className="max-w-xs truncate">
                        {String(r[k] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {totalAnalyzed > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment distribution</CardTitle>
              <CardDescription>Share of positive vs negative reviews</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(e: any) => `${e.name}: ${((e.percent ?? 0) * 100).toFixed(1)}%`}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Count by sentiment</CardTitle>
              <CardDescription>{totalAnalyzed} reviews analyzed</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.label === "Positive" ? "var(--success)" : "var(--destructive)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {totalAnalyzed > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Per-row predictions with confidence</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 50).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="max-w-md truncate">{r.text}</TableCell>
                    <TableCell>
                      {r.result ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                          style={{
                            backgroundColor:
                              r.result.label === "POSITIVE"
                                ? "var(--success)"
                                : "var(--destructive)",
                          }}
                        >
                          {r.result.label === "POSITIVE" ? "POS 😀" : "NEG 😞"}
                        </span>
                      ) : r.error ? (
                        <span className="text-xs text-destructive">error</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.result ? `${(r.result.score * 100).toFixed(1)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 50 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Showing first 50 of {rows.length} rows.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}