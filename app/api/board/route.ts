import { asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { cards, cases, groups, statuses } from "../../../db/schema";
import { canEditSite, requireEditorResponse } from "../../../lib/access";

type Entity = "card" | "group" | "status";

const clean = (value: unknown, max = 120) => typeof value === "string" ? value.trim().slice(0, max) : "";
const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
const errorResponse = (error: unknown) => Response.json(
  { error: error instanceof Error ? error.message : "Не удалось выполнить действие" },
  { status: 500 },
);

async function readBoard() {
  const db = getDb();
  let [groupRows, statusRows, cardRows] = await Promise.all([
    db.select().from(groups).orderBy(asc(groups.position), asc(groups.id)),
    db.select().from(statuses).orderBy(asc(statuses.position), asc(statuses.id)),
    db.select().from(cards).orderBy(asc(cards.position), asc(cards.id)),
  ]);

  if (groupRows.length === 0 && statusRows.length === 0) {
    await db.insert(groups).values([
      { id: 1, name: "Гипотезы", position: 1 },
      { id: 2, name: "Кейсы / тесты", position: 2 },
      { id: 3, name: "Инструменты", position: 3 },
      { id: 4, name: "Процессы Материи", position: 4 },
      { id: 5, name: "Встречи / решения", position: 5 },
    ]).onConflictDoNothing();
    await db.insert(statuses).values([
      { id: 1, name: "Входящие", position: 1 },
      { id: 2, name: "В работе", position: 2 },
      { id: 3, name: "Ждём", position: 3 },
      { id: 4, name: "Готово", position: 4 },
    ]).onConflictDoNothing();
    groupRows = await db.select().from(groups).orderBy(asc(groups.position), asc(groups.id));
    statusRows = await db.select().from(statuses).orderBy(asc(statuses.position), asc(statuses.id));
    cardRows = await db.select().from(cards).orderBy(asc(cards.position), asc(cards.id));
  }

  let archiveStatus = statusRows.find((status) => status.name.toLocaleLowerCase("ru") === "архив");
  if (!archiveStatus) {
    await db.insert(statuses).values({ name: "Архив", position: 5 }).onConflictDoNothing();
    statusRows = await db.select().from(statuses).orderBy(asc(statuses.position), asc(statuses.id));
    archiveStatus = statusRows.find((status) => status.name.toLocaleLowerCase("ru") === "архив");
  }

  const doneStatus = statusRows.find((status) => status.name.toLocaleLowerCase("ru") === "готово");
  if (doneStatus && archiveStatus) {
    const archiveBefore = Date.now() - 48 * 60 * 60 * 1000;
    const eligibleIds = cardRows
      .filter((card) => {
        const storedDate = card.updatedAt.includes("T") ? card.updatedAt : card.updatedAt.replace(" ", "T") + "Z";
        return card.statusId === doneStatus.id && Date.parse(storedDate) <= archiveBefore;
      })
      .map((card) => card.id);
    if (eligibleIds.length > 0) {
      const archivedAt = new Date().toISOString();
      await db.update(cards).set({ statusId: archiveStatus.id, updatedAt: archivedAt }).where(inArray(cards.id, eligibleIds));
      cardRows = cardRows.map((card) => eligibleIds.includes(card.id) ? { ...card, statusId: archiveStatus!.id, updatedAt: archivedAt } : card);
    }
  }
  const caseRows = await db.select({ id: cases.id, title: cases.title }).from(cases).orderBy(asc(cases.position), asc(cases.id));
  return { groups: groupRows, statuses: statusRows, cards: cardRows, cases: caseRows };
}

export async function GET() {
  try { return Response.json({ ...(await readBoard()), canEdit: await canEditSite() }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const entity = body.entity as Entity;
    const db = getDb();
    const position = Date.now();

    if (entity === "card") {
      const title = clean(body.title);
      const description = clean(body.description, 280);
      const role = clean(body.role, 100);
      const dueDate = clean(body.dueDate, 10) || null;
      const outcome = clean(body.outcome, 1200);
      const links = clean(body.links, 1200);
      const caseId = number(body.caseId);
      const isFocus = body.isFocus === true;
      const groupId = number(body.groupId);
      const statusId = number(body.statusId);
      if (!title || !groupId || !statusId) return Response.json({ error: "Заполни название, группу и статус" }, { status: 400 });
      await db.insert(cards).values({ title, description, role, dueDate, outcome, links, caseId, isFocus, groupId, statusId, position });
      return Response.json({ ...(await readBoard()), canEdit: true }, { status: 201 });
    }

    const name = clean(body.name, 60);
    if (!name) return Response.json({ error: "Укажи название" }, { status: 400 });
    if (entity === "group") {
      const [group] = await db.insert(groups).values({ name, position }).returning();
      return Response.json({ group }, { status: 201 });
    }
    if (entity === "status") {
      const [status] = await db.insert(statuses).values({ name, position }).returning();
      return Response.json({ status }, { status: 201 });
    }
    return Response.json({ error: "Неизвестный тип" }, { status: 400 });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const entity = body.entity as Entity;
    const id = number(body.id);
    if (!id) return Response.json({ error: "Некорректный id" }, { status: 400 });
    const db = getDb();

    if (entity === "card") {
      const values: { title?: string; description?: string; role?: string; dueDate?: string | null; outcome?: string; links?: string; caseId?: number | null; isFocus?: boolean; groupId?: number; statusId?: number; updatedAt?: string } = {};
      if (body.title !== undefined) values.title = clean(body.title);
      if (body.description !== undefined) values.description = clean(body.description, 280);
      if (body.role !== undefined) values.role = clean(body.role, 100);
      if (body.dueDate !== undefined) values.dueDate = clean(body.dueDate, 10) || null;
      if (body.outcome !== undefined) values.outcome = clean(body.outcome, 1200);
      if (body.links !== undefined) values.links = clean(body.links, 1200);
      if (body.caseId !== undefined) values.caseId = number(body.caseId);
      if (body.isFocus !== undefined) values.isFocus = body.isFocus === true;
      if (body.groupId !== undefined) values.groupId = number(body.groupId) ?? undefined;
      if (body.statusId !== undefined) {
        values.statusId = number(body.statusId) ?? undefined;
        values.updatedAt = new Date().toISOString();
      }
      if (values.title === "") return Response.json({ error: "Название не может быть пустым" }, { status: 400 });
      await db.update(cards).set(values).where(eq(cards.id, id));
    } else if (entity === "group") {
      const name = clean(body.name, 60);
      if (!name) return Response.json({ error: "Название не может быть пустым" }, { status: 400 });
      await db.update(groups).set({ name }).where(eq(groups.id, id));
    } else if (entity === "status") {
      const name = clean(body.name, 60);
      if (!name) return Response.json({ error: "Название не может быть пустым" }, { status: 400 });
      await db.update(statuses).set({ name }).where(eq(statuses.id, id));
    } else return Response.json({ error: "Неизвестный тип" }, { status: 400 });
    return Response.json({ ...(await readBoard()), canEdit: true });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireEditorResponse();
    if (denied) return denied;
    const body = await request.json() as Record<string, unknown>;
    const entity = body.entity as Entity;
    const id = number(body.id);
    if (!id) return Response.json({ error: "Некорректный id" }, { status: 400 });
    const db = getDb();

    if (entity === "card") await db.delete(cards).where(eq(cards.id, id));
    else if (entity === "group") {
      const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(groups);
      if (Number(total) <= 1) return Response.json({ error: "Нужна хотя бы одна группа" }, { status: 400 });
      await db.delete(cards).where(eq(cards.groupId, id));
      await db.delete(groups).where(eq(groups.id, id));
    } else if (entity === "status") {
      const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(statuses);
      if (Number(total) <= 1) return Response.json({ error: "Нужен хотя бы один статус" }, { status: 400 });
      await db.delete(cards).where(eq(cards.statusId, id));
      await db.delete(statuses).where(eq(statuses.id, id));
    } else return Response.json({ error: "Неизвестный тип" }, { status: 400 });
    return Response.json({ ...(await readBoard()), canEdit: true });
  } catch (error) { return errorResponse(error); }
}
