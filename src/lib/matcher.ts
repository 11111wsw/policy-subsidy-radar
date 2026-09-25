import type {
  CompanyProfile,
  ConditionCheck,
  MatchStatus,
  PolicyMatch,
} from "@/lib/types";

const KEY_GROUPS = [
  "在校大学生",
  "毕业10年内高校毕业生",
  "登记失业半年以上人员",
  "就业困难人员",
  "持证残疾人",
  "自主就业退役军人",
];

const RND_EXCLUDED_INDUSTRIES = [
  "批发零售",
  "住宿餐饮",
  "房地产",
  "租赁和商务服务",
  "娱乐",
  "烟草",
];

function isKeyGroup(founderType: string): boolean {
  return KEY_GROUPS.some((g) => founderType.includes(g));
}

// 前 sceneCount 个条件为「场景条件」(不满足=不符合)，其余为「门槛条件」(不满足=有差距)
function derive(
  checks: ConditionCheck[],
  sceneCount: number
): { status: MatchStatus; gaps: string[] } {
  const scenes = checks.slice(0, sceneCount);
  const gates = checks.slice(sceneCount);
  if (scenes.some((c) => c.met === false)) {
    return { status: "ineligible", gaps: [] };
  }
  if (
    scenes.some((c) => c.met === null) ||
    gates.some((c) => c.met === null)
  ) {
    return { status: "unknown", gaps: [] };
  }
  const failed = checks.filter((c) => c.met === false);
  if (failed.length > 0) {
    return {
      status: "gap",
      gaps: failed.map((c) => `${c.label}：${c.detail}`),
    };
  }
  return { status: "eligible", gaps: [] };
}

const lishuiCheck = (p: CompanyProfile): ConditionCheck => ({
  label: "注册地在丽水",
  met: p.registeredInLishui,
  detail: p.registeredInLishui ? "符合" : "注册地不在丽水",
});

function matchGradJobSubsidy(p: CompanyProfile): PolicyMatch {
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "招用毕业2年内高校毕业生",
      met: p.recentGradCount > 0,
      detail: `当前招用 ${p.recentGradCount} 人`,
    },
    {
      label: "企业为中小微规模",
      met:
        p.companySize === "micro" ||
        p.companySize === "small" ||
        p.companySize === "medium",
      detail:
        p.companySize === "unknown"
          ? "当前企业规模为不确定"
          : `当前规模：${{ micro: "微型", small: "小型", medium: "中型", large: "大型" }[p.companySize]}`,
    },
    {
      label: "签订1年及以上劳动合同",
      met: p.contractOneYear,
      detail: p.contractOneYear ? "已签订" : "存在未签1年以上合同的情况",
    },
    {
      label: "依法缴纳社会保险",
      met: p.insuredCount > 0,
      detail: `参保 ${p.insuredCount} 人`,
    },
    {
      label: "工资低于全省加权平均工资",
      met: p.wageBelowAverage,
      detail:
        p.wageBelowAverage === null
          ? "未确认，需核对工资水平"
          : p.wageBelowAverage
            ? "符合"
            : "工资不低于全省平均，不满足条件",
    },
  ];
  const { status, gaps } = derive(checks, 2);
  return {
    policyId: "grad-job-subsidy",
    status,
    amount: status === "eligible" ? 3000 * p.recentGradCount : null,
    amountNote: `按每人每年3000元 × ${p.recentGradCount}人，仅计首年；最长可领3年`,
    checks,
    gaps,
  };
}

function matchExpansionSubsidy(p: CompanyProfile): PolicyMatch {
  const total = p.recentGradCount + p.unemployedYouthCount;
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "招用符合条件的毕业生或登记失业青年",
      met: total > 0,
      detail: `毕业生 ${p.recentGradCount} 人、登记失业青年 ${p.unemployedYouthCount} 人`,
    },
    {
      label: "缴纳失业保险费1个月以上",
      met: p.unemploymentInsuranceMonths >= 1,
      detail: `已连续缴费 ${p.unemploymentInsuranceMonths} 个月`,
    },
    {
      label: "签订劳动合同",
      met: p.contractOneYear,
      detail: p.contractOneYear ? "已签订" : "存在未签合同情况",
    },
  ];
  const { status, gaps } = derive(checks, 2);
  return {
    policyId: "expansion-subsidy",
    status,
    amount: status === "eligible" ? 1500 * total : null,
    amountNote: `按每人1500元 × ${total}人，一次性发放`,
    checks,
    gaps,
  };
}

function matchUnemploymentReturn(p: CompanyProfile): PolicyMatch {
  const threshold = p.employeeCount <= 30 ? 20 : 5.5;
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "已参加失业保险",
      met: p.unemploymentInsuranceMonths >= 1,
      detail:
        p.unemploymentInsuranceMonths >= 1
          ? "已参保"
          : "尚未参加失业保险",
    },
    {
      label: "足额缴费满12个月",
      met: p.unemploymentInsuranceMonths >= 12,
      detail: `已连续缴费 ${p.unemploymentInsuranceMonths} 个月`,
    },
    {
      label: `上年度裁员率不高于${threshold}%`,
      met:
        p.lastYearLayoffRate === null
          ? null
          : p.lastYearLayoffRate <= threshold,
      detail:
        p.lastYearLayoffRate === null
          ? "未填写裁员率，需按参保人数变动核算"
          : `上年度裁员率 ${p.lastYearLayoffRate}%`,
    },
    {
      label: "非严重失信企业",
      met: !p.isSeriousDishonest,
      detail: p.isSeriousDishonest ? "属于严重失信企业" : "符合",
    },
  ];
  let { status, gaps } = derive(checks, 2);
  const ratio = p.companySize === "large" ? 0.3 : 0.6;
  let amount: number | null = null;
  let amountNote = `按上年度实缴失业保险费的${ratio * 100}%返还`;
  if (status === "eligible") {
    if (p.lastYearUnemploymentTax > 0) {
      amount = Math.round(p.lastYearUnemploymentTax * ratio);
      amountNote = `上年度实缴失业保险费 ${p.lastYearUnemploymentTax} 元 × ${ratio * 100}%`;
    } else {
      status = "unknown";
      amountNote = "需填写上年度实际缴纳失业保险费金额后估算";
    }
  }
  return {
    policyId: "unemployment-return",
    status,
    amount,
    amountNote,
    checks,
    gaps,
  };
}

function matchInternshipSubsidy(p: CompanyProfile): PolicyMatch {
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "经认定为就业见习基地",
      met: p.isInternshipBase,
      detail: p.isInternshipBase ? "已认定" : "尚未认定，可先申请基地资质",
    },
    {
      label: "有见习人员",
      met: p.internCount > 0,
      detail: `当前见习 ${p.internCount} 人`,
    },
    {
      label: "按月发放不低于最低工资的生活费",
      met: p.localMinWage > 0,
      detail: `适用月最低工资 ${p.localMinWage} 元`,
    },
  ];
  const { status, gaps } = derive(checks, 1);
  return {
    policyId: "internship-subsidy",
    status,
    amount:
      status === "eligible"
        ? Math.round(p.localMinWage * 0.6 * p.internCount * 12)
        : null,
    amountNote: `最低工资 ${p.localMinWage} 元 × 60% × ${p.internCount}人 × 12个月；保险费、指导管理费另计`,
    checks,
    gaps,
  };
}

function matchStartupSubsidy(p: CompanyProfile): PolicyMatch {
  const keyGroup = isKeyGroup(p.founderType);
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "经营者属于重点人群",
      met: keyGroup,
      detail: `经营者身份：${p.founderType}`,
    },
    {
      label: "初次创业",
      met: p.isFirstVenture,
      detail: p.isFirstVenture ? "初次创办" : "非初次创业",
    },
    {
      label: "正常经营6个月以上",
      met: p.operatingMonths >= 6,
      detail: `已正常经营 ${p.operatingMonths} 个月`,
    },
  ];
  const { status, gaps } = derive(checks, 2);
  return {
    policyId: "startup-subsidy",
    status,
    amount: status === "eligible" ? 10000 : null,
    amountNote: "一次性发放10000元",
    checks,
    gaps,
  };
}

function matchJobCreationSubsidy(p: CompanyProfile): PolicyMatch {
  const keyGroup = isKeyGroup(p.founderType);
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "经营者属于重点人群",
      met: keyGroup,
      detail: `经营者身份：${p.founderType}`,
    },
    {
      label: "带动1人以上就业",
      met: p.jobsCreated >= 1,
      detail: `带动就业 ${p.jobsCreated} 人`,
    },
    {
      label: "为带动员工连续缴纳社保满1年",
      met: p.socialInsuranceOneYear,
      detail: p.socialInsuranceOneYear
        ? "已满1年"
        : "社保缴费未满12个月，满期后可申报",
    },
  ];
  const { status, gaps } = derive(checks, 2);
  let amount: number | null = null;
  let amountNote = "按年发放，最长3年";
  if (status === "eligible") {
    const base = 2000 + Math.max(0, p.jobsCreated - 3) * 1000;
    const capped = Math.min(base, 20000);
    amount = p.ruralEcommerce ? Math.round(capped * 1.2) : capped;
    amountNote = p.ruralEcommerce
      ? `带动 ${p.jobsCreated} 人，农村电商上浮20%，本年约 ${amount} 元`
      : `带动 ${p.jobsCreated} 人，本年 ${amount} 元`;
  }
  return {
    policyId: "job-creation-subsidy",
    status,
    amount,
    amountNote,
    checks,
    gaps,
  };
}

function matchRnDSuperDeduction(p: CompanyProfile): PolicyMatch {
  const excluded = RND_EXCLUDED_INDUSTRIES.some((i) =>
    p.industry.includes(i)
  );
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "企业有真实研发投入",
      met: p.hasRnD,
      detail: p.hasRnD
        ? `上年度研发费用 ${p.rndAmount} 万元`
        : "无研发投入",
    },
    {
      label: "行业适用（非批发零售、住宿餐饮等禁止行业）",
      met: !excluded,
      detail: `所属行业：${p.industry}`,
    },
    {
      label: "研发费用按财务制度规范归集",
      met: p.hasRnD ? true : false,
      detail: p.hasRnD ? "需建立研发费用辅助账并留存备查" : "无研发费用",
    },
  ];
  const { status, gaps } = derive(checks, 2);
  return {
    policyId: "rnd-super-deduction",
    status,
    amount: null,
    amountNote: "税收优惠，实际减税额取决于企业应纳税所得额，无法直接估算",
    checks,
    gaps,
  };
}

function matchTechSMEReward(p: CompanyProfile): PolicyMatch {
  if (p.techSMEStatus !== "none") {
    return {
      policyId: "tech-sme-reward",
      status: "unknown",
      amount: null,
      amountNote:
        "企业已认定科技型中小企业，如未领取奖励请咨询属地主管部门",
      checks: [
        {
          label: "科技型中小企业认定状态",
          met: null,
          detail:
            p.techSMEStatus === "national" ? "已国家入库" : "已省级认定",
        },
      ],
      gaps: [],
    };
  }
  const innovation = p.ipCount > 0 || p.hasRnD;
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "具备创新基础（知识产权或研发投入）",
      met: innovation,
      detail: `知识产权 ${p.ipCount} 件，${p.hasRnD ? "有研发投入" : "无研发投入"}`,
    },
    {
      label: "尚未认定省级科技型中小企业",
      met: p.techSMEStatus === "none",
      detail: "未认定，可按年度批次申报",
    },
  ];
  const { status, gaps } = derive(checks, 2);
  return {
    policyId: "tech-sme-reward",
    status,
    amount: status === "eligible" ? 50000 : null,
    amountNote: "按青田县口径一次性奖励5万元，各区县标准不同",
    checks,
    gaps,
  };
}

function matchRnDFiscalReward(p: CompanyProfile): PolicyMatch {
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "上年度研发费用超过50万元",
      met: p.rndAmount >= 50,
      detail: `上年度研发费用 ${p.rndAmount} 万元`,
    },
    {
      label: "研发费用同比增长10%以上",
      met: p.rndGrowth === null ? null : p.rndGrowth >= 10,
      detail:
        p.rndGrowth === null
          ? "未填写同比增速"
          : `同比增长 ${p.rndGrowth}%`,
    },
    {
      label: "研发费用占营业收入3%以上",
      met: p.rndRatio === null ? null : p.rndRatio >= 3,
      detail:
        p.rndRatio === null
          ? "未填写占比"
          : `研发投入占营收 ${p.rndRatio}%`,
    },
  ];
  let { status, gaps } = derive(checks, 2);
  let amount: number | null = null;
  let amountNote = "增量部分按10%、基础部分按1%奖励（区县口径）";
  if (status === "eligible" && p.rndGrowth !== null) {
    const prev = p.rndAmount / (1 + p.rndGrowth / 100);
    const increment = p.rndAmount - prev;
    amount = Math.round((increment * 0.1 + prev * 0.01) * 10000);
    amountNote = `上年研发费 ${prev.toFixed(1)} 万元、增量 ${increment.toFixed(1)} 万元，测算约 ${amount} 元`;
  }
  return {
    policyId: "rnd-fiscal-reward",
    status,
    amount,
    amountNote,
    checks,
    gaps,
  };
}

function matchSpecialized(p: CompanyProfile): PolicyMatch {
  const checks: ConditionCheck[] = [
    lishuiCheck(p),
    {
      label: "具备科技型中小企业或同等创新基础",
      met: p.techSMEStatus !== "none" || p.ipCount > 0,
      detail:
        p.techSMEStatus !== "none"
          ? `已${p.techSMEStatus === "national" ? "国家入库" : "省级认定"}`
          : `知识产权 ${p.ipCount} 件，未认定科技型中小企业`,
    },
    {
      label: "尚未认定专精特新",
      met: !p.isSpecialized,
      detail: p.isSpecialized ? "已认定" : "未认定",
    },
  ];
  const { status, gaps } = derive(checks, 2);
  return {
    policyId: "specialized-new-enterprise",
    status,
    amount: null,
    amountNote: "认定后可申报各级奖励，金额以属地政策为准",
    checks,
    gaps,
  };
}

const MATCHERS = [
  matchGradJobSubsidy,
  matchExpansionSubsidy,
  matchUnemploymentReturn,
  matchInternshipSubsidy,
  matchStartupSubsidy,
  matchJobCreationSubsidy,
  matchRnDSuperDeduction,
  matchTechSMEReward,
  matchRnDFiscalReward,
  matchSpecialized,
];

export function matchPolicies(profile: CompanyProfile): PolicyMatch[] {
  return MATCHERS.map((fn) => fn(profile));
}

export function summarize(match: PolicyMatch[]): {
  cash: number;
  eligibleCount: number;
  gapCount: number;
  unknownCount: number;
  taxBenefitCount: number;
} {
  return {
    cash: match
      .filter((m) => m.status === "eligible")
      .reduce((sum, m) => sum + (m.amount ?? 0), 0),
    eligibleCount: match.filter((m) => m.status === "eligible").length,
    gapCount: match.filter((m) => m.status === "gap").length,
    unknownCount: match.filter((m) => m.status === "unknown").length,
    taxBenefitCount: match.filter(
      (m) => m.status === "eligible" && m.amount === null
    ).length,
  };
}
