export async function GET() {
  const configured = Boolean(process.env.WICKAI_MODEL);

  return Response.json(
    {
      ok: true,
      service: "wickai",
      aiConfigured: configured,
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
