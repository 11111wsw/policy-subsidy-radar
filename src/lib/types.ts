// 企业画像：用户通过测评表单填写，演示企业为预置样例
export interface CompanyProfile {
  companyName: string;
  registeredInLishui: boolean; // 注册地是否在丽水
  industry: string; // 所属行业
  employeeCount: number; // 员工总数
  insuredCount: number; // 社保参保人数
  companySize: "micro" | "small" | "medium" | "large" | "unknown"; // 企业规模
  unemploymentInsuranceMonths: number; // 失业保险连续缴费月数
  lastYearLayoffRate: number | null; // 上年度裁员率(%)，null 表示不确定
  isSeriousDishonest: boolean; // 是否严重失信
  recentGradCount: number; // 招用毕业2年内高校毕业生人数
  unemployedYouthCount: number; // 招用16-24岁登记失业青年人数
  contractOneYear: boolean; // 是否签订1年及以上劳动合同
  wageBelowAverage: boolean | null; // 工资是否低于全省加权平均工资
  lastYearUnemploymentTax: number; // 上年度实际缴纳失业保险费(元)
  isInternshipBase: boolean; // 是否为就业见习基地
  internCount: number; // 见习人数
  localMinWage: number; // 当地月最低工资标准(元)
  founderType: string; // 创始人/经营者身份
  isFirstVenture: boolean; // 是否初次创业
  operatingMonths: number; // 正常经营月数
  jobsCreated: number; // 带动就业人数(不含经营者本人)
  socialInsuranceOneYear: boolean; // 带动就业员工是否连续缴纳社保满1年
  ruralEcommerce: boolean; // 是否从事农村电子商务创业
  hasRnD: boolean; // 是否有研发投入
  rndAmount: number; // 上年度研发费用(万元)
  rndGrowth: number | null; // 研发费用同比增长(%)
  rndRatio: number | null; // 研发费用占营业收入比重(%)
  ipCount: number; // 知识产权数量(软著/专利)
  techSMEStatus: "none" | "provincial" | "national"; // 科技型中小企业认定情况
  isSpecialized: boolean; // 是否已认定专精特新
}

// 匹配状态
export type MatchStatus =
  | "eligible" // 符合，可申报
  | "gap" // 存在差距，补齐后可申报
  | "ineligible" // 不符合
  | "unknown"; // 关键信息待确认

export interface ConditionCheck {
  label: string; // 申报条件
  met: boolean | null; // true 满足 / false 不满足 / null 待确认
  detail: string; // 企业实际情况说明
}

export interface PolicyMatch {
  policyId: string;
  status: MatchStatus;
  amount: number | null; // 首年估算金额(元)，无法估算为 null
  amountNote: string; // 金额口径说明
  checks: ConditionCheck[];
  gaps: string[]; // 差距与补齐建议
}

export interface Policy {
  id: string;
  name: string;
  category: "就业补贴" | "创业扶持" | "科技创新";
  authority: string; // 主管部门
  summary: string; // 一句话政策说明
  benefit: string; // 补贴标准
  timeline: string; // 申报时间/窗口
  duration: string; // 补贴期限
  materials: string[]; // 申报材料清单
  process: string; // 办理路径
  sourceName: string; // 来源名称
  sourceUrl: string; // 来源链接
  regionNote?: string; // 地域/口径说明
  fallbackAdvice: string; // AI 不可用时的兜底申报建议
}
