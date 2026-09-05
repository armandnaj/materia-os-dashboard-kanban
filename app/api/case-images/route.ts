import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { caseImages, cases } from "../../../db/schema";
import { getBucket } from "../../../lib/storage";
import { requireEditorResponse } from "../../../lib/access";

const imageRows = (caseId: number) => getDb().select({
  id: caseImages.id,
  caseId: caseImages.caseId,
  filename: caseImages.filename,
  contentType: caseImages.contentType,
  position: caseImages.position,
  createdAt: caseImages.createdAt,
}).from(caseImages).where(eq(caseImages.caseId, caseId)).orderBy(asc(caseImages.position), asc(caseImages.id));

export async function GET(request: Request) {
  try {
    const caseId = Number(new URL(request.url).searchParams.get("caseId"));
    if (!Number.isInteger(caseId) || caseId < 1) return Response.json({ error: "Некорректный кейс" }, { status: 400 });
    return Response.json({ images: await imageRows(caseId) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось загрузить изображения" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const form = await request.formData();
    const caseId = Number(form.get("caseId"));
    const file = form.get("file");
    if (!Number.isInteger(caseId) || caseId < 1 || !(file instanceof File)) return Response.json({ error: "Выбери изображение" }, { status: 400 });
    if (!file.type.startsWith("image/")) return Response.json({ error: "Можно загружать только изображения" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: "Файл должен быть меньше 10 МБ" }, { status: 400 });
    const db = getDb();
    const [caseRow] = await db.select({ id: cases.id }).from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!caseRow) return Response.json({ error: "Кейс не найден" }, { status: 404 });
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-90) || "image";
    const objectKey = `cases/${caseId}/${crypto.randomUUID()}-${safeName}`;
    const bucket = getBucket();
    await bucket.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { caseId: String(caseId), filename: file.name } });
    try {
      await db.insert(caseImages).values({ caseId, objectKey, filename: file.name.slice(0, 180), contentType: file.type, position: Date.now() });
    } catch (error) {
      await bucket.delete(objectKey);
      throw error;
    }
    return Response.json({ images: await imageRows(caseId) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось загрузить изображение" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const id = Number((await request.json() as { id?: unknown }).id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Некорректное изображение" }, { status: 400 });
    const db = getDb();
    const [row] = await db.select().from(caseImages).where(eq(caseImages.id, id)).limit(1);
    if (!row) return Response.json({ error: "Изображение не найдено" }, { status: 404 });
    await getBucket().delete(row.objectKey);
    await db.delete(caseImages).where(eq(caseImages.id, id));
    return Response.json({ images: await imageRows(row.caseId) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось удалить изображение" }, { status: 500 }); }
}
