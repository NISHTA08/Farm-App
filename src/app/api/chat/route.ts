import { NextRequest, NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";

const SYSTEM_PROMPT = `You are KhethAi Assistant, an expert AI agricultural advisor for Indian farmers.

Your expertise covers:
- Crop diseases, pests, and treatment recommendations
- Seasonal planting calendars for Indian crops
- Weather impact on farming decisions
- Market prices and best time to sell
- Government schemes (PM-KISAN, PMFBY, KCC, Soil Health Card, eNAM, PM-KUSUM)
- Organic and chemical farming practices
- Soil health, irrigation, and water management
- Post-harvest storage and handling

Guidelines:
- Give practical, actionable advice that small-holder Indian farmers can implement
- Mention specific product names, dosages, and application methods available in India
- Include costs in INR when relevant
- Keep responses concise but thorough (2-4 paragraphs)
- Use simple language that can be understood by farmers with limited formal education
- When asked about schemes, provide eligibility criteria and how to apply
- If you're unsure, say so rather than guessing
- Format lists with bullet points for readability`;

function getBedrockClient() {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim() || "";
  return new BedrockRuntimeClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const GROQ_MODEL = "llama-3.3-70b-versatile";

async function chatWithGroq(
  messages: { role: string; text: string }[],
  apiKey: string
): Promise<string> {
  const openAiMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.text })),
  ];
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: openAiMessages,
      max_tokens: 1000,
      temperature: 0.6,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message || res.statusText);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Invalid Groq response");
  return content;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages: chatHistory, provider = "aws" } = body;

    if (!chatHistory || !Array.isArray(chatHistory) || chatHistory.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const filtered: { role: string; text: string }[] = [];
    for (const msg of chatHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        if (filtered.length > 0 && filtered[filtered.length - 1].role === msg.role) {
          filtered[filtered.length - 1].text += "\n" + msg.text;
        } else {
          filtered.push({ role: msg.role, text: msg.text });
        }
      }
    }

    if (filtered.length === 0 || filtered[0].role !== "user") {
      return NextResponse.json({ error: "No valid user message to respond to." }, { status: 400 });
    }

    // Use Groq when provider is "groq" and API key is set
    if (provider === "groq") {
      const groqKey = process.env.GROQ_API_KEY?.trim();
      if (!groqKey) {
        return NextResponse.json({
          reply:
            "To use Groq AI, add GROQ_API_KEY to your .env.local file. Get a free key at https://console.groq.com → API Keys → Create API Key. Then restart the dev server.",
        });
      }
      try {
        const reply = await chatWithGroq(filtered, groqKey);
        return NextResponse.json({ reply });
      } catch (groqError: unknown) {
        const err = groqError instanceof Error ? groqError : new Error(String(groqError));
        console.error("Groq chat error:", err);
        return NextResponse.json({
          reply: `Groq error: ${err.message}. Check that GROQ_API_KEY is correct and try again.`,
        });
      }
    }

    // AWS Bedrock
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({
        reply:
          "To use AWS Bedrock, add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your .env.local file. Or switch to Groq using the toggle above.",
      });
    }

    const bedrockMessages: Message[] = filtered.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: [{ text: msg.text }],
    }));

    const command = new ConverseCommand({
      modelId: "amazon.nova-lite-v1:0",
      system: [{ text: SYSTEM_PROMPT }],
      messages: bedrockMessages,
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.6,
      },
    });

    const bedrock = getBedrockClient();
    const response = await bedrock.send(command);
    const reply = response.output?.message?.content?.[0]?.text || "I could not generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const err = error instanceof Error ? error : new Error(String(error));
    const msg = (err.message || String(error)).slice(0, 300);
    const errName = err.name || "Error";
    let hint =
      "Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in .env.local and restart the dev server.";
    if (errName === "CredentialsProviderError" || msg.includes("credentials") || msg.includes("security token")) {
      hint = "AWS credentials are invalid or expired. Check IAM keys in .env.local.";
    } else if (errName === "AccessDeniedException" || msg.includes("AccessDenied") || msg.includes("not authorized")) {
      hint = "Your IAM user needs Bedrock access. Attach policy AmazonBedrockFullAccess (or at least bedrock:InvokeModel).";
    } else if (errName === "ValidationException" && msg.toLowerCase().includes("operation not allowed")) {
      hint = [
        "Bedrock is blocking access at the account level (not IAM).",
        "1) In AWS Console open Bedrock → Build → Chat (Playground). Choose Amazon Nova Lite and click Run. If you get the same error there, it’s account-wide.",
        "2) Check that your account’s billing/tax region is supported: Billing → Account → edit Address.",
        "3) Open a free support case: Support → Create case → Account and billing. Ask to enable Bedrock model invocation for your account.",
      ].join("\n\n");
    } else if (errName === "ValidationException" || (msg.includes("model") && msg.includes("not found"))) {
      hint = "Nova Lite should auto-enable on first use. Ensure IAM has AmazonBedrockFullAccess and AWS_REGION=us-east-1 in .env.local.";
    }
    return NextResponse.json({
      reply: `The AI assistant is unavailable. ${hint}\n\n**Actual error:** ${errName}: ${msg}`,
    });
  }
}
