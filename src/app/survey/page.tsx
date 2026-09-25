"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Radar } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CompanyProfile } from "@/lib/types";

const initialProfile: CompanyProfile = {
  companyName: "",
  registeredInLishui: true,
  industry: "制造业",
  employeeCount: 0,
  insuredCount: 0,
  companySize: "micro",
  unemploymentInsuranceMonths: 0,
  lastYearLayoffRate: null,
  isSeriousDishonest: false,
  recentGradCount: 0,
  unemployedYouthCount: 0,
  contractOneYear: true,
  wageBelowAverage: null,
  lastYearUnemploymentTax: 0,
  isInternshipBase: false,
  internCount: 0,
  localMinWage: 2010,
  founderType: "普通经营者",
  isFirstVenture: false,
  operatingMonths: 0,
  jobsCreated: 0,
  socialInsuranceOneYear: false,
  ruralEcommerce: false,
  hasRnD: false,
  rndAmount: 0,
  rndGrowth: null,
  rndRatio: null,
  ipCount: 0,
  techSMEStatus: "none",
  isSpecialized: false,
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  allowNull = false,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  allowNull?: boolean;
}) {
  return (
    <Input
      type="number"
      value={value === null ? "" : value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") {
          onChange(allowNull ? null : 0);
          return;
        }
        onChange(Number(v));
      }}
    />
  );
}

function BoolRadios({
  value,
  onChange,
  withUnknown = false,
  groupId,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  withUnknown?: boolean;
  groupId: string;
}) {
  const v = value === true ? "yes" : value === false ? "no" : "unknown";
  const options: { val: string; label: string }[] = [
    { val: "yes", label: "是" },
    { val: "no", label: "否" },
  ];
  if (withUnknown) options.push({ val: "unknown", label: "不确定" });
  return (
    <RadioGroup
      value={v}
      onValueChange={(s) =>
        onChange(s === "yes" ? true : s === "no" ? false : null)
      }
      className="flex items-center gap-5 pt-1"
    >
      {options.map((o) => (
        <div key={o.val} className="flex items-center gap-1.5">
          <RadioGroupItem value={o.val} id={`${groupId}-${o.val}`} />
          <Label htmlFor={`${groupId}-${o.val}`} className="font-normal">
            {o.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export default function SurveyPage() {
  const router = useRouter();
  const [form, setForm] = useState<CompanyProfile>(initialProfile);
  const set = <K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  function submit() {
    sessionStorage.setItem("profile", JSON.stringify(form));
    router.push("/result");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Radar className="size-5 text-emerald-600" />
            企业画像测评
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">填写企业信息</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            约 2 分钟完成。不确定的问题可选「不确定」或留空，不会影响其他政策的匹配。
          </p>
        </div>

        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
            <CardDescription>企业注册与规模情况</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="企业名称（选填）">
              <Input
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="例如：丽水某某有限公司"
              />
            </Field>
            <Field label="所属行业">
              <Select
                value={form.industry}
                onValueChange={(v) => set("industry", v ?? "制造业")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "制造业",
                    "智能制造与软件信息",
                    "农村电子商务",
                    "批发零售",
                    "住宿餐饮",
                    "现代服务业",
                    "农业",
                    "其他",
                  ].map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="注册地在丽水">
              <BoolRadios
                groupId="lishui"
                value={form.registeredInLishui}
                onChange={(v) => set("registeredInLishui", v ?? false)}
              />
            </Field>
            <Field label="企业规模">
              <Select
                value={form.companySize}
                onValueChange={(v) =>
                  set(
                    "companySize",
                    (v as CompanyProfile["companySize"]) ?? "micro"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="micro">微型</SelectItem>
                  <SelectItem value="small">小型</SelectItem>
                  <SelectItem value="medium">中型</SelectItem>
                  <SelectItem value="large">大型</SelectItem>
                  <SelectItem value="unknown">不确定</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="员工总数（人）">
              <NumberInput
                value={form.employeeCount}
                onChange={(v) => set("employeeCount", v ?? 0)}
              />
            </Field>
            <Field label="社保参保人数（人）">
              <NumberInput
                value={form.insuredCount}
                onChange={(v) => set("insuredCount", v ?? 0)}
              />
            </Field>
          </CardContent>
        </Card>

        {/* 用工与社保 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">用工与社保</CardTitle>
            <CardDescription>用于匹配就业类补贴和稳岗返还</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="失业保险连续缴费月数">
              <NumberInput
                value={form.unemploymentInsuranceMonths}
                onChange={(v) => set("unemploymentInsuranceMonths", v ?? 0)}
              />
            </Field>
            <Field
              label="上年度裁员率（%）"
              hint="可按上年度参保职工减少人数占比估算，不确定可留空"
            >
              <NumberInput
                value={form.lastYearLayoffRate}
                onChange={(v) => set("lastYearLayoffRate", v)}
                allowNull
              />
            </Field>
            <Field label="上年度实缴失业保险费（元）">
              <NumberInput
                value={form.lastYearUnemploymentTax}
                onChange={(v) => set("lastYearUnemploymentTax", v ?? 0)}
              />
            </Field>
            <Field label="是否严重失信企业">
              <BoolRadios
                groupId="dishonest"
                value={form.isSeriousDishonest}
                onChange={(v) => set("isSeriousDishonest", v ?? false)}
              />
            </Field>
            <Field label="招用毕业2年内高校毕业生（人）">
              <NumberInput
                value={form.recentGradCount}
                onChange={(v) => set("recentGradCount", v ?? 0)}
              />
            </Field>
            <Field label="招用16-24岁登记失业青年（人）">
              <NumberInput
                value={form.unemployedYouthCount}
                onChange={(v) => set("unemployedYouthCount", v ?? 0)}
              />
            </Field>
            <Field label="均签订1年及以上劳动合同">
              <BoolRadios
                groupId="contract"
                value={form.contractOneYear}
                onChange={(v) => set("contractOneYear", v ?? false)}
              />
            </Field>
            <Field label="员工工资低于全省加权平均工资">
              <BoolRadios
                groupId="wage"
                value={form.wageBelowAverage}
                onChange={(v) => set("wageBelowAverage", v)}
                withUnknown
              />
            </Field>
          </CardContent>
        </Card>

        {/* 见习 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">就业见习</CardTitle>
            <CardDescription>用于匹配就业见习补贴</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="已认定为就业见习基地">
              <BoolRadios
                groupId="base"
                value={form.isInternshipBase}
                onChange={(v) => set("isInternshipBase", v ?? false)}
              />
            </Field>
            <Field label="当前见习人数">
              <NumberInput
                value={form.internCount}
                onChange={(v) => set("internCount", v ?? 0)}
              />
            </Field>
            <Field label="当地月最低工资标准（元）">
              <NumberInput
                value={form.localMinWage}
                onChange={(v) => set("localMinWage", v ?? 0)}
              />
            </Field>
          </CardContent>
        </Card>

        {/* 创业情况 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">创业情况</CardTitle>
            <CardDescription>用于匹配创业类扶持政策</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="经营者身份">
              <Select
                value={form.founderType}
                onValueChange={(v) => set("founderType", v ?? "普通经营者")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "普通经营者",
                    "在校大学生",
                    "毕业10年内高校毕业生",
                    "登记失业半年以上人员",
                    "就业困难人员",
                    "持证残疾人",
                    "自主就业退役军人",
                  ].map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="是否初次创业">
              <BoolRadios
                groupId="first"
                value={form.isFirstVenture}
                onChange={(v) => set("isFirstVenture", v ?? false)}
              />
            </Field>
            <Field label="正常经营月数">
              <NumberInput
                value={form.operatingMonths}
                onChange={(v) => set("operatingMonths", v ?? 0)}
              />
            </Field>
            <Field label="带动就业人数（不含经营者本人）">
              <NumberInput
                value={form.jobsCreated}
                onChange={(v) => set("jobsCreated", v ?? 0)}
              />
            </Field>
            <Field label="带动员工连续缴社保满1年">
              <BoolRadios
                groupId="ins1y"
                value={form.socialInsuranceOneYear}
                onChange={(v) => set("socialInsuranceOneYear", v ?? false)}
              />
            </Field>
            <Field label="从事农村电子商务创业">
              <BoolRadios
                groupId="rural"
                value={form.ruralEcommerce}
                onChange={(v) => set("ruralEcommerce", v ?? false)}
              />
            </Field>
          </CardContent>
        </Card>

        {/* 研发与资质 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">研发与资质</CardTitle>
            <CardDescription>用于匹配科技创新类政策</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="企业有研发投入">
              <BoolRadios
                groupId="rnd"
                value={form.hasRnD}
                onChange={(v) => set("hasRnD", v ?? false)}
              />
            </Field>
            <Field label="上年度研发费用（万元）">
              <NumberInput
                value={form.rndAmount}
                onChange={(v) => set("rndAmount", v ?? 0)}
              />
            </Field>
            <Field label="研发费用同比增长（%）">
              <NumberInput
                value={form.rndGrowth}
                onChange={(v) => set("rndGrowth", v)}
                allowNull
              />
            </Field>
            <Field label="研发费用占营业收入比重（%）">
              <NumberInput
                value={form.rndRatio}
                onChange={(v) => set("rndRatio", v)}
                allowNull
              />
            </Field>
            <Field label="知识产权数量（软著/专利）">
              <NumberInput
                value={form.ipCount}
                onChange={(v) => set("ipCount", v ?? 0)}
              />
            </Field>
            <Field label="科技型中小企业认定情况">
              <Select
                value={form.techSMEStatus}
                onValueChange={(v) =>
                  set(
                    "techSMEStatus",
                    (v as CompanyProfile["techSMEStatus"]) ?? "none"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未认定</SelectItem>
                  <SelectItem value="provincial">省级认定</SelectItem>
                  <SelectItem value="national">国家入库</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="已认定专精特新">
              <BoolRadios
                groupId="spec"
                value={form.isSpecialized}
                onChange={(v) => set("isSpecialized", v ?? false)}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 pb-6 sm:flex-row">
          <Button size="lg" className="flex-1" onClick={submit}>
            生成匹配结果
            <ArrowRight className="size-4" />
          </Button>
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
