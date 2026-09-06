import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export const maxDuration = 30;

const baseURL = (process.env.WICKAI_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
const apiKey = process.env.WICKAI_API_KEY;
const defaultModel = process.env.WICKAI_MODEL;

const requestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
  model: z.string().trim().min(1).optional(),
});

const provider = createOpenAI({
  baseURL,
  ...(apiKey ? { apiKey } : {}),
});

export async function POST(req: Request) {
  if (!defaultModel) {
    return Response.json(
      { error: "WickAI is not configured. Set WICKAI_MODEL in your environment." },
      { status: 500 },
    );
  }

  try {
    const payload = requestSchema.parse(await req.json());
    const messages = payload.messages as UIMessage[];
    const selectedModel = payload.model?.trim() || defaultModel;

    const result = streamText({
      model: provider.chat(selectedModel),
      system:
        "You are WickAI, a helpful, concise, technically capable AI assistant. Be clear, honest about uncertainty, and format code cleanly. Prefer useful direct answers over filler.",
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("WickAI chat error:", error);
    return Response.json({ error: "Unable to process the request." }, { status: 500 });
  }
}
