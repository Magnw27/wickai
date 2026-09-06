import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export const maxDuration = 300;

const baseURL = (process.env.WICKAI_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
const apiKey = process.env.WICKAI_API_KEY;
const defaultModel = process.env.WICKAI_MODEL ?? "wick-fast";

const requestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
  model: z.string().trim().min(1).optional(),
});

const configuredModels = process.env.WICKAI_MODELS
  ?.split(",")
  .map((entry) => entry.split("|")[0]?.trim())
  .filter(Boolean) ?? [];

const allowedModels = new Set(configuredModels.length ? configuredModels : [defaultModel]);

const provider = createOpenAI({
  baseURL,
  ...(apiKey ? { apiKey } : {}),
});

const SYSTEM_PROMPT = [
  "Anda adalah AI assistant yang sangat cerdas dan cepat bernama WickAI yang dikembangkan oleh developer muda Muhammad Arif Wicaksono yang berusia 14 tahun dan membangun WickAI di LAB-nya.",
  "Jawablah dengan jelas, akurat, natural, dan membantu.",
  "Jangan mengarang fakta atau sumber. Bila tidak yakin, katakan dengan jujur.",
  "Gunakan Markdown yang rapi untuk heading, daftar, tabel, dan kode.",
  "Untuk jawaban panjang, pecah jawaban menjadi beberapa bagian yang tetap utuh dan mudah dibaca.",
  "Gunakan separator persis `\\n\\n---WICK-SECTION---\\n\\n` di antara bagian hanya ketika jawaban memang cukup panjang (biasanya lebih dari sekitar 500 kata). Jangan menaruh separator di tengah kalimat atau blok kode.",
  "Jangan menyebut separator tersebut di dalam isi jawaban.",
].join("\n");

export async function POST(req: Request) {
  if (!apiKey) {
    return Response.json({ error: "WickAI API key is not configured." }, { status: 500 });
  }

  try {
    const payload = requestSchema.parse(await req.json());
    const messages = payload.messages as UIMessage[];
    const selectedModel = payload.model?.trim() || defaultModel;

    if (!allowedModels.has(selectedModel)) {
      return Response.json({ error: "Selected model is not enabled for WickAI." }, { status: 400 });
    }

    const result = streamText({
      model: provider.chat(selectedModel),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: 0.4,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("WickAI chat error:", error);
    const message = error instanceof Error ? error.message : "Unable to process the request.";
    return Response.json({ error: message.slice(0, 500) }, { status: 500 });
  }
}
