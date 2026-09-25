import { NextRequest, NextResponse } from "next/server";
import { getPolicy } from "@/data/policies";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const policyId = body?.policyId as string;
  const profile = body?.profile as unknown;
  const policy = getPolicy(policyId);
  if (!policy) {
    return NextResponse.json({ error: "政策不存在" }, { status: 404 });
  }

  const key = process.env.DEEPSEEK_API_KEY;

  // 未配置 API Key 时返回预置建议，保证演示闭环完整
  if (!key) {
    return NextResponse.json({ advice: policy.fallbackAdvice, fallback: true });
  }

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "你是企业政策申报顾问。只基于给定的政策信息和企业情况给出简洁、可执行的申报建议，不编造政策之外的金额、条件和时限。",
          },
          {
            role: "user",
            content: `政策名称：${policy.name}\n补贴标准：${policy.benefit}\n申报时间：${policy.timeline}\n补贴期限：${policy.duration}\n企业情况：${JSON.stringify(profile)}\n请给出：1）是否建议申报；2）申报前需要补齐或核实的事项；3）申报步骤建议。`,
          },
        ],
      }),
    });
    const data = await res.json();
    const advice = data?.choices?.[0]?.message?.content;
    if (!advice) {
      return NextResponse.json({ advice: policy.fallbackAdvice, fallback: true });
    }
    return NextResponse.json({ advice });
  } catch {
    return NextResponse.json({ advice: policy.fallbackAdvice, fallback: true });
  }
}
