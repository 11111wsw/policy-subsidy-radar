import { NextRequest, NextResponse } from "next/server";
import { getDemoCompany } from "@/lib/demoCompanies";
import { CompanyProfile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const demoId = formData.get("demoId") as string | null;
    const profileJson = formData.get("profile") as string | null;

    if (!file) {
      return NextResponse.json({ error: "请上传政策文件" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "文件大小不能超过 5MB" }, { status: 400 });
    }

    // 解析文件文本
    const buffer = Buffer.from(await file.arrayBuffer());
    let fileText = "";
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      // @ts-ignore — 直接引用 pdf-parse 核心解析模块，绕过 index.js 的测试文件依赖
      const { default: pdf } = await import("pdf-parse/lib/pdf-parse.js");
      const data = await pdf(buffer);
      fileText = data.text;
    } else {
      fileText = buffer.toString("utf-8");
    }

    if (!fileText.trim()) {
      return NextResponse.json({ error: "未能从文件中提取到文本内容，请确认文件不是扫描件" }, { status: 400 });
    }

    // 获取企业画像
    let profile: CompanyProfile | null = null;
    if (profileJson) {
      profile = JSON.parse(profileJson);
    } else if (demoId) {
      profile = getDemoCompany(demoId) ?? null;
    }
    if (!profile) {
      return NextResponse.json({ error: "请选择企业画像" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI 服务未配置" }, { status: 500 });
    }

    const prompt = `你是一个惠企政策分析专家。请根据以下政策文件内容和企业画像，逐条分析该企业是否符合申报条件。

【政策文件内容】
${fileText.slice(0, 8000)}

【企业画像】
${JSON.stringify(profile, null, 2)}

请严格输出 JSON 格式（不要输出 markdown 代码块，不要输出任何其他文字），字段如下：
{
  "policyName": "政策名称",
  "summary": "政策简要说明（50字以内）",
  "subsidyStandard": "补贴标准与金额",
  "conditions": [
    {"condition": "申报条件描述", "met": true或false, "evidence": "企业对应的实际情况说明"}
  ],
  "overallStatus": "符合"或"有差距"或"不符合"或"待确认",
  "gapAnalysis": "差距分析（如无差距则为空字符串）",
  "requiredMaterials": ["所需材料1", "所需材料2"],
  "suggestion": "申报建议（100字以内）"
}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze policy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "分析失败，请稍后重试" },
      { status: 500 }
    );
  }
}
