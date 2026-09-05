import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { caseImages, cases } from "../../../db/schema";
import { getBucket } from "../../../lib/storage";
import { canEditSite, requireEditorResponse } from "../../../lib/access";

const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

async function readCases() {
  return getDb().select().from(cases).orderBy(asc(cases.position), asc(cases.id));
}

export async function GET(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (Number.isInteger(id) && id > 0) {
      await readCases();
      const [item] = await getDb().select().from(cases).where(eq(cases.id, id)).limit(1);
      return item ? Response.json({ case: item, canEdit: await canEditSite() }) : Response.json({ error: "Кейс не найден" }, { status: 404 });
    }
    return Response.json({ cases: await readCases(), canEdit: await canEditSite() });
  }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось загрузить кейсы" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const title = clean(body.title, 120);
    if (!title) return Response.json({ error: "Укажи название" }, { status: 400 });
    const [created] = await getDb().insert(cases).values({
      title,
      category: clean(body.category, 60) || "Кейс",
      hypothesis: clean(body.hypothesis),
      action: clean(body.action),
      result: clean(body.result),
      takeaway: clean(body.takeaway),
      stage: clean(body.stage, 40) || "Проверено",
      period: clean(body.period, 40),
      position: Date.now(),
    }).returning();
    return Response.json({ cases: await readCases(), case: created, canEdit: true }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось сохранить кейс" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const id = number(body.id);
    const title = clean(body.title, 120);
    if (!id || !title) return Response.json({ error: "Проверь название кейса" }, { status: 400 });
    await getDb().update(cases).set({
      title,
      category: clean(body.category, 60) || "Кейс",
      hypothesis: clean(body.hypothesis),
      action: clean(body.action),
      result: clean(body.result),
      takeaway: clean(body.takeaway),
      stage: clean(body.stage, 40) || "Проверено",
      period: clean(body.period, 40),
      updatedAt: new Date().toISOString(),
    }).where(eq(cases.id, id));
    return Response.json({ cases: await readCases(), canEdit: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось обновить кейс" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const id = number(body.id);
    if (!id) return Response.json({ error: "Некорректный id" }, { status: 400 });
    const db = getDb();
    const images = await db.select({ objectKey: caseImages.objectKey }).from(caseImages).where(eq(caseImages.caseId, id));
    if (images.length > 0) await Promise.all(images.map((image) => getBucket().delete(image.objectKey)));
    await db.delete(cases).where(eq(cases.id, id));
    return Response.json({ cases: await readCases(), canEdit: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось удалить кейс" }, { status: 500 }); }
}
