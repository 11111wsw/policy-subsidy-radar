"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { demoCompanies } from "@/lib/demoCompanies";

interface ConditionItem {
  condition: string;
  met: boolean;
  evidence: string;
}

interface AnalyzeResult {
  policyName: string;
  summary: string;
  subsidyStandard: string;
  conditions: ConditionItem[];
  overallStatus: string;
  gapAnalysis: string;
  requiredMaterials: string[];
  suggestion: string;
}

export function PolicyUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [demoId, setDemoId] = useState<string>("");
  const [useMyProfile, setUseMyProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleAnalyze = async () => {
    if (!file) {
      setError("请先选择文件");
      return;
    }
    if (!demoId && !useMyProfile) {
      setError("请选择企业画像");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (useMyProfile) {
        const profileStr =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem("profile")
            : null;
        if (profileStr) {
          formData.append("profile", profileStr);
        } else {
          setError("未找到测评结果，请先完成企业画像测评");
          setLoading(false);
          return;
        }
      } else if (demoId) {
        formData.append("demoId", demoId);
      }

      const res = await fetch("/api/analyze-policy", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "分析失败");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败");
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = (status: string) => {
    if (status === "符合") return "bg-emerald-100 text-emerald-700";
    if (status === "有差距") return "bg-amber-100 text-amber-700";
    if (status === "不符合") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-emerald-600" />
          上传政策文件，AI 智能解读
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 文件上传区 */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-gray-300 hover:border-emerald-300"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile(f);
            }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="size-5 text-emerald-600" />
              <span className="font-medium">{file.name}</span>
              <span className="text-sm text-muted-foreground">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="mx-auto size-8 text-gray-400" />
              <p className="text-sm text-muted-foreground">
                拖拽文件到此处，或点击选择（支持 PDF、TXT，最大 5MB）
              </p>
            </div>
          )}
        </div>

        {/* 企业画像选择 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">选择企业画像</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={demoId}
              onValueChange={(v) => {
                setDemoId(v ?? "");
                setUseMyProfile(false);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="选择演示企业" />
              </SelectTrigger>
              <SelectContent>
                {demoCompanies.map((c) => (
                  <SelectItem key={c.demoId} value={c.demoId}>
                    {c.companyName.replace("（演示）", "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={useMyProfile ? "default" : "outline"}
              onClick={() => {
                setUseMyProfile(!useMyProfile);
                if (!useMyProfile) setDemoId("");
              }}
            >
              使用我的测评结果
            </Button>
          </div>
        </div>

        {/* 分析按钮 */}
        <Button onClick={handleAnalyze} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {loading ? "AI 正在分析..." : "开始分析"}
        </Button>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* 结果展示 */}
        {result && (
          <div className="space-y-4 rounded-lg border bg-zinc-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{result.policyName}</h3>
              <Badge className={statusStyle(result.overallStatus)}>
                {result.overallStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
            {result.subsidyStandard && (
              <p className="text-sm">
                <span className="font-medium">补贴标准：</span>
                {result.subsidyStandard}
              </p>
            )}

            <div>
              <p className="mb-2 text-sm font-medium">申报条件对照</p>
              <div className="space-y-2">
                {result.conditions?.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {c.met ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                    )}
                    <div>
                      <span>{c.condition}</span>
                      <span className="ml-1 text-muted-foreground">
                        — {c.evidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.gapAnalysis && (
              <div className="rounded bg-amber-50 p-3 text-sm">
                <span className="font-medium">差距分析：</span>
                {result.gapAnalysis}
              </div>
            )}

            {result.requiredMaterials?.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium">所需材料</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.requiredMaterials.map((m, i) => (
                    <Badge key={i} variant="outline">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded bg-emerald-50 p-3 text-sm">
              <span className="font-medium">申报建议：</span>
              {result.suggestion}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
