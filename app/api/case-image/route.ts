import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { caseImages } from "../../../db/schema";
import { getBucket } from "../../../lib/storage";

export async function GET(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) return new Response("Not found", { status: 404 });
    const [row] = await getDb().select().from(caseImages).where(eq(caseImages.id, id)).limit(1);
    if (!row) return new Response("Not found", { status: 404 });
    const object = await getBucket().get(row.objectKey);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body as BodyInit, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || row.contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
      },
    });
  } catch { return new Response("Not found", { status: 404 }); }
}
