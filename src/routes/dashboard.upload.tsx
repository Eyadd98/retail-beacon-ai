import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard/upload")({
  component: UploadPage,
});

type FileState = { name: string; size: number; progress: number; done: boolean };

function UploadPage() {
  const [files, setFiles] = useState<FileState[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach((f) => {
      const item: FileState = { name: f.name, size: f.size, progress: 0, done: false };
      setFiles((prev) => [...prev, item]);
      const id = setInterval(() => {
        setFiles((prev) =>
          prev.map((p) => {
            if (p.name !== item.name) return p;
            const next = Math.min(100, p.progress + Math.random() * 18 + 6);
            if (next >= 100) {
              clearInterval(id);
              return { ...p, progress: 100, done: true };
            }
            return { ...p, progress: next };
          }),
        );
      }, 280);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload Data</h1>
        <p className="text-sm text-muted-foreground">Drop CSV or Excel files to ingest into your dashboard.</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition ${
              dragging
                ? "border-primary bg-accent/60"
                : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-accent/40"
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-elegant">
              <UploadCloud className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="mt-4 text-base font-semibold">Drop your files here</h3>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse. CSV, XLS, XLSX — up to 50MB.</p>
            <Button type="button" variant="outline" size="sm" className="mt-4">Select files</Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".csv,.xls,.xlsx"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              {files.map((f) => (
                <div key={f.name} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <Progress value={f.progress} className="mt-2 h-1.5" />
                  </div>
                  {f.done ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <button
                      onClick={() => setFiles((p) => p.filter((x) => x.name !== f.name))}
                      className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}