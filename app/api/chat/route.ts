import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export const maxDuration = 30;

const baseURL = process.env.WICKAI_BASE_URL ?? "https://openrouter.ai/api/v1";
const apiKey = process.env.WICKAI_API_KEY;
const defaultModel = process.env.WICKAI_MODEL;

const provider = createOpenAI({ baseURL, apiKey });

export async function POST(req: Request) {
  if (!apiKey || !defaultModel) {
    return new Response("WickAI is not configured. Set WICKAI_API_KEY and WICKAI_MODEL.", { status: 500 });
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: provider.chat(defaultModel),
      system:
        "You are WickAI, a helpful, concise, technically capable AI assistant. Be clear, honest about uncertainty, and format code cleanly.",
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("WickAI chat error:", error);
    return new Response("Unable to process the request.", { status: 500 });
  }
}
