import { getCatalog } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(await getCatalog(), { headers: { "Cache-Control": "no-store" } });
}
