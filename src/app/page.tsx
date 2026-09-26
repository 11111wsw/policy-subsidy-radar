import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Radar,
  FileCheck2,
  CircleDollarSign,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoCompanies } from "@/lib/demoCompanies";
import { policies } from "@/data/policies";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Radar className="size-5 text-emerald-600" />
            补贴雷达
          </div>
          <Link href="/survey" className={buttonVariants({ size: "sm" })}>
            开始测评
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto w-full max-w-5xl px-4 py-16 text-center sm:py-24">
          <Badge variant="secondary" className="mb-5 gap-1.5 rounded-full">
            <CircleDollarSign className="size-3.5 text-emerald-600" />
            丽水企业 · 惠企政策智能匹配
          </Badge>
          <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            别让企业该领的补贴，
            <br className="hidden sm:block" />
            静静躺在政策文件里
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            花 2 分钟填写企业画像，自动比对就业、创业、科技三类政策，告诉你能领多少、还差什么条件、要准备哪些申报材料。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/survey"
              className={buttonVariants({
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              免费开始测评
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/result?demo=demo-startup"
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "w-full sm:w-auto",
              })}
            >
              先看演示效果
            </Link>
          </div>
        </section>

        {/* 演示企业 */}
        <section className="border-y bg-zinc-50">
          <div className="mx-auto w-full max-w-5xl px-4 py-14">
            <h2 className="text-center text-xl font-semibold">
              三家虚构演示企业，点击直接查看匹配结果
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              无需注册、无需填写，所有数据均为演示样例
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {demoCompanies.map((c) => (
                <Card key={c.demoId} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {c.companyName.replace("（演示）", "")}
                    </CardTitle>
                    <CardDescription>{c.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Link
                      href={`/result?demo=${c.demoId}`}
                      className={buttonVariants({
                        variant: "secondary",
                        className: "w-full",
                      })}
                    >
                      查看匹配结果
                      <ArrowRight className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 工作原理 */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14">
          <h2 className="text-center text-xl font-semibold">三步完成政策匹配</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: "1. 填写企业画像",
                desc: "约 2 分钟，覆盖用工、社保、创业、研发等关键信息，不确定的字段可以留空。",
              },
              {
                icon: Radar,
                title: "2. 规则引擎逐条匹配",
                desc: "每项申报条件独立核对并给出依据，结论可解释、可复核，不让 AI 凭空判断。",
              },
              {
                icon: FileCheck2,
                title: "3. 查看金额与申报清单",
                desc: "预计可领金额汇总、差距补齐建议、材料清单与办理路径，一次备齐。",
              },
            ].map((s) => (
              <Card key={s.title}>
                <CardHeader>
                  <s.icon className="mb-2 size-7 text-emerald-600" />
                  <CardTitle className="text-base">{s.title}</CardTitle>
                  <CardDescription className="leading-6">
                    {s.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* 政策覆盖 */}
          <div className="mt-12 rounded-xl border bg-zinc-50 p-6">
            <p className="text-sm font-medium">演示政策库覆盖（10 项）</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {policies.map((p) => (
                <Badge key={p.id} variant="outline" className="bg-white">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="border-t bg-zinc-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 text-xs leading-6 text-muted-foreground">
          <p>
            免责声明：本产品为个人求职作品集演示项目，政策数据整理自丽水市及浙江省公开文件（截至
            2026 年 9 月），政策具有时效性与地域差异，申报条件与补贴标准请以主管部门最新公告为准。演示企业及数据均为虚构，不涉及任何真实企业信息。
          </p>
          <p className="mt-2">
            技术栈：Next.js · React · Tailwind CSS · shadcn/ui · TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}
