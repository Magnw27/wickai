export async function GET() {
  const configured = process.env.WICKAI_MODELS
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, ...labelParts] = entry.split("|");
      return {
        id: id.trim(),
        label: labelParts.join("|").trim() || id.trim(),
      };
    })
    .filter((model) => model.id);

  const fallback = process.env.WICKAI_MODEL
    ? [{ id: process.env.WICKAI_MODEL, label: process.env.WICKAI_MODEL }]
    : [];

  return Response.json({ models: configured?.length ? configured : fallback }, {
    headers: { "Cache-Control": "no-store" },
  });
}
