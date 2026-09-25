"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Radar,
  CircleDollarSign,
  TriangleAlert,
  CircleHelp,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CompanyProfile, PolicyMatch, MatchStatus } from "@/lib/types";
import { matchPolicies, summarize } from "@/lib/matcher";
import { getDemoCompany } from "@/lib/demoCompanies";
import { getPolicy } from "@/data/policies";

const STATUS_META: Record<
  MatchStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  eligible: { label: "可申报", variant: "default", icon: CheckCircle2 },
  gap: { label: "有差距", variant: "destructive", icon: TriangleAlert },
  unknown: { label: "待确认", variant: "secondary", icon: CircleHelp },
  ineligible: { label: "不符合", variant: "outline", icon: XCircle },
};

function money(n: number): string {
  return n.toLocaleString("zh-CN");
}

function MatchCard({
  match,
  demoId,
}: {
  match: PolicyMatch;
  demoId?: string | null;
}) {
  const policy = getPolicy(match.policyId);
  if (!policy) return null;
  const meta = STATUS_META[match.status];
  const detailHref = demoId
    ? `/policy/${policy.id}?demo=${demoId}`
    : `/policy/${policy.id}`;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{policy.name}</CardTitle>
          <Badge variant={meta.variant} className="shrink-0 gap-1">
            <meta.icon className="size-3" />
            {meta.label}
          </Badge>
        </div>
        <CardDescription>{policy.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {match.status === "eligible" && (
          <div className="rounded-lg bg-emerald-50 p-3">
            {match.amount !== null ? (
              <p className="text-lg font-bold text-emerald-700">
                预计可领 {money(match.amount)} 元
              </p>
            ) : (
              <p className="text-sm font-medium text-emerald-700">
                符合条件，可享受税收优惠
              </p>
            )}
            <p className="mt-1 text-xs leading-5 text-emerald-700/80">
              {match.amountNote}
            </p>
          </div>
        )}
        {match.status === "gap" && (
          <div className="space-y-2 rounded-lg bg-amber-50 p-3">
            <p className="text-xs font-medium text-amber-800">补齐以下条件后可申报：</p>
            <ul className="space-y-1">
              {match.gaps.map((g, i) => (
                <li key={i} className="text-xs leading-5 text-amber-800">
                  · {g}
                </li>
              ))}
            </ul>
            <p className="pt-1 text-xs text-amber-700/80">{match.amountNote}</p>
          </div>
        )}
        {match.status === "unknown" && (
          <div className="rounded-lg bg-zinc-100 p-3 text-xs leading-5 text-muted-foreground">
            {match.amountNote}
          </div>
        )}
        {match.status === "ineligible" && (
          <p className="text-xs leading-5 text-muted-foreground">
            {match.checks[0]?.detail}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={detailHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          查看申报条件与材料清单
          <ArrowRight className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const demoId = searchParams.get("demo");
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [source, setSource] = useState<"demo" | "survey">("survey");

  useEffect(() => {
    if (demoId) {
      const demo = getDemoCompany(demoId);
      if (demo) {
        setProfile(demo);
        setSource("demo");
        return;
      }
    }
    const raw = sessionStorage.getItem("profile");
    if (raw) {
      setProfile(JSON.parse(raw) as CompanyProfile);
      setSource("survey");
    }
  }, [demoId]);

  if (!profile) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <CircleHelp className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">没有找到测评数据</h1>
        <p className="text-sm text-muted-foreground">
          请先完成企业画像测评，或直接查看演示企业的匹配结果。
        </p>
        <div className="flex gap-3">
          <Link href="/survey" className={buttonVariants()}>
            去测评
          </Link>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline" })}
          >
            回首页
          </Link>
        </div>
      </main>
    );
  }

  const matches = matchPolicies(profile);
  const stats = summarize(matches);
  const groups: { status: MatchStatus; title: string; matches: PolicyMatch[] }[] = (
    [
      ["eligible", "可申报政策"],
      ["gap", "补齐条件后可申报"],
      ["unknown", "关键信息待确认"],
      ["ineligible", "暂不适用"],
    ] as [MatchStatus, string][]
  ).map(([status, title]) => ({
    status,
    title,
    matches: matches.filter((m) => m.status === status),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Radar className="size-5 text-emerald-600" />
            匹配结果
          </div>
          <Link
            href="/survey"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            重新测评
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">
        {/* 总览 */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {source === "demo" && (
              <Badge variant="secondary" className="mb-3">
                演示企业
              </Badge>
            )}
            <h1 className="text-lg font-bold">
              {profile.companyName || "未命名企业"}
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
                <CircleDollarSign className="size-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight text-emerald-600">
                  {money(stats.cash)} 元
                </p>
                <p className="text-xs text-muted-foreground">
                  预计首年可申领的现金补贴合计（不含税收优惠）
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{stats.eligibleCount}</p>
                <p className="text-xs text-muted-foreground">项可申报</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{stats.gapCount}</p>
                <p className="text-xs text-muted-foreground">项有差距</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{stats.unknownCount}</p>
                <p className="text-xs text-muted-foreground">项待确认</p>
              </div>
            </div>
            {stats.taxBenefitCount > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                另有 {stats.taxBenefitCount} 项税收优惠政策符合条件，减税额按企业实际情况确定。
              </p>
            )}
          </CardContent>
        </Card>

        {/* 分组结果 */}
        {groups.map((group) =>
          group.matches.length > 0 ? (
            <section key={group.status} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {group.title}（{group.matches.length}）
              </h2>
              {group.status === "ineligible" ? (
                <Accordion>
                  <AccordionItem value="list" className="rounded-lg border px-4">
                    <AccordionTrigger className="text-sm">
                      查看 {group.matches.length} 项不适用政策
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {group.matches.map((m) => (
                        <MatchCard
                          key={m.policyId}
                          match={m}
                          demoId={source === "demo" ? demoId : null}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                group.matches.map((m) => (
                  <MatchCard
                    key={m.policyId}
                    match={m}
                    demoId={source === "demo" ? demoId : null}
                  />
                ))
              )}
            </section>
          ) : null
        )}

        <div className="rounded-lg border bg-zinc-50 p-4 text-xs leading-6 text-muted-foreground">
          金额为基于企业填报信息的首年估算，多年期补贴仅计首年；政策具有时效性与地域差异，正式申报前请以主管部门最新公告为准。
        </div>

        <div className="flex flex-col gap-3 pb-6 sm:flex-row">
          <Link
            href="/survey"
            className={buttonVariants({ size: "lg", className: "flex-1" })}
          >
            修改信息重新测评
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

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ResultContent />
    </Suspense>
  );
}
