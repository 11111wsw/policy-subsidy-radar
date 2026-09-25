"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Radar,
  CheckCircle2,
  XCircle,
  CircleHelp,
  Sparkles,
  Loader2,
  ExternalLink,
  TriangleAlert,
  ListChecks,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import type { CompanyProfile, PolicyMatch } from "@/lib/types";
import { getPolicy } from "@/data/policies";
import { matchPolicies } from "@/lib/matcher";
import { getDemoCompany } from "@/lib/demoCompanies";

const CATEGORY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  就业补贴: "default",
  创业扶持: "secondary",
  科技创新: "outline",
};

function StatusIcon({ met }: { met: boolean | null }) {
  if (met === true) return <CheckCircle2 className="size-5 text-emerald-600" />;
  if (met === false) return <XCircle className="size-5 text-red-500" />;
  return <CircleHelp className="size-5 text-muted-foreground" />;
}

function PolicyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const policy = getPolicy(id);
  const searchParams = useSearchParams();
  const demoId = searchParams.get("demo");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (demoId) {
      const d = getDemoCompany(demoId);
      if (d) {
        setProfile(d);
        return;
      }
    }
    const raw = sessionStorage.getItem("profile");
    if (raw) setProfile(JSON.parse(raw) as CompanyProfile);
  }, [demoId]);

  if (!policy) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">未找到该政策</h1>
        <Link href="/" className={buttonVariants()}>
          返回首页
        </Link>
      </main>
    );
  }

  const match: PolicyMatch | undefined = profile
    ? matchPolicies(profile).find((m) => m.policyId === id)
    : undefined;

  async function getAdvice() {
    setLoading(true);
    try {
      const res = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: id, profile }),
      });
      const data = await res.json();
      setAdvice(data.advice as string);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Radar className="size-5 text-emerald-600" />
            政策详情
          </div>
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            首页
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-8">
        {/* 标题 */}
        <div>
          <Badge variant={CATEGORY_VARIANT[policy.category]} className="mb-2">
            {policy.category}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">{policy.name}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {policy.summary}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            主管部门：{policy.authority}
          </p>
        </div>

        {/* 企业对照 */}
        {profile && match && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                本企业条件对照
                {match.status === "eligible" && (
                  <Badge className="gap-1">
                    <CheckCircle2 className="size-3" />
                    可申报
                  </Badge>
                )}
                {match.status === "gap" && (
                  <Badge variant="destructive" className="gap-1">
                    <TriangleAlert className="size-3" />
                    有差距
                  </Badge>
                )}
                {match.status === "unknown" && (
                  <Badge variant="secondary">待确认</Badge>
                )}
                {match.status === "ineligible" && (
                  <Badge variant="outline">不符合</Badge>
                )}
              </CardTitle>
              <CardDescription>{profile.companyName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {match.status === "eligible" && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  {match.amount !== null
                    ? `预计可领 ${match.amount.toLocaleString("zh-CN")} 元`
                    : "符合条件，可享受税收优惠"}
                  <span className="block text-xs text-emerald-700/80">
                    {match.amountNote}
                  </span>
                </div>
              )}
              {match.status === "gap" && (
                <div className="space-y-1 rounded-lg bg-amber-50 p-3">
                  {match.gaps.map((g, i) => (
                    <p key={i} className="text-xs leading-5 text-amber-800">
                      · {g}
                    </p>
                  ))}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申报条件</TableHead>
                    <TableHead className="w-16 text-center">状态</TableHead>
                    <TableHead>企业情况</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {match.checks.map((c) => (
                    <TableRow key={c.label}>
                      <TableCell className="font-medium">{c.label}</TableCell>
                      <TableCell className="text-center">
                        <span className="flex justify-center">
                          <StatusIcon met={c.met} />
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.detail}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* 补贴标准 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">补贴标准与期限</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">补贴标准</span>
              <span className="text-right font-medium">{policy.benefit}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">申报时间</span>
              <span className="text-right">{policy.timeline}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">补贴期限</span>
              <span className="text-right">{policy.duration}</span>
            </div>
          </CardContent>
        </Card>

        {/* 材料清单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-emerald-600" />
              申报材料清单
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {policy.materials.map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  {m}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              办理路径：{policy.process}
            </p>
          </CardContent>
        </Card>

        {/* AI 建议 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-emerald-600" />
              AI 申报建议
            </CardTitle>
            <CardDescription>
              结合政策要求与企业情况，生成个性化申报建议
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={getAdvice} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  正在生成…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  生成申报建议
                </>
              )}
            </Button>
            {advice && (
              <div className="whitespace-pre-wrap rounded-lg border bg-zinc-50 p-4 text-sm leading-7">
                {advice}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 来源 */}
        <div className="rounded-lg border bg-zinc-50 p-4 text-xs leading-6 text-muted-foreground">
          <p>
            政策来源：
            <a
              href={policy.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 underline underline-offset-2"
            >
              {policy.sourceName}
              <ExternalLink className="size-3" />
            </a>
          </p>
          {policy.regionNote && <p className="mt-1">口径说明：{policy.regionNote}</p>}
          <p className="mt-1">
            免责声明：政策具有时效性与地域差异，申报前请以主管部门最新公告为准。
          </p>
        </div>

        <div className="flex flex-col gap-3 pb-6 sm:flex-row">
          <Link
            href="/survey"
            className={buttonVariants({ size: "lg", className: "flex-1" })}
          >
            测评我的企业
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <PolicyDetail params={params} />
    </Suspense>
  );
}
