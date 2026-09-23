"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Link2, Plus, Star, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type Group = { id: number; name: string; position: number };
type Status = { id: number; name: string; position: number };
type CaseSummary = { id: number; title: string };
type Card = { id: number; title: string; description: string; role: string; dueDate: string | null; outcome: string; links: string; caseId: number | null; isFocus: boolean; groupId: number; statusId: number; position: number };
type CardValues = { title: string; description: string; role: string; dueDate: string; outcome: string; links: string; caseId: number | null; isFocus: boolean; groupId: number; statusId: number };
type Board = { groups: Group[]; statuses: Status[]; cards: Card[]; cases: CaseSummary[]; canEdit: boolean };
type Entity = "card" | "group" | "status";
const emptyBoard: Board = { groups: [], statuses: [], cards: [], cases: [], canEdit: false };
const cacheKey = "materia-os-board-cache-v3";

function formatDueDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
}

async function request(method: string, body?: Record<string, unknown>) {
  const response = await fetch("/api/board", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Что-то пошло не так");
  return data;
}

function DeleteConfirm({ open, onOpenChange, title, description, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; onConfirm: () => void;
}) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="rounded-none border-black bg-[#f4f2fb] shadow-[8px_8px_0_#191919]">
      <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel className="rounded-none border-black bg-transparent">Отмена</AlertDialogCancel><AlertDialogAction variant="destructive" className="rounded-none" onClick={onConfirm}>Удалить</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

function CardEditor({ card, initialGroupId, initialStatusId, groups, statuses, caseItems, canEdit, open, onOpenChange, onSave, onDelete, onCreateCase }: {
  card: Card | null; initialGroupId: number | null; initialStatusId: number | null; groups: Group[]; statuses: Status[]; caseItems: CaseSummary[]; canEdit: boolean; open: boolean;
  onOpenChange: (open: boolean) => void; onSave: (values: CardValues) => Promise<void>; onDelete: (id: number) => Promise<void>; onCreateCase: (card: Card) => Promise<number>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [outcome, setOutcome] = useState("");
  const [links, setLinks] = useState("");
  const [caseId, setCaseId] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setRole(card?.role ?? "");
    setDueDate(card?.dueDate ?? "");
    setOutcome(card?.outcome ?? "");
    setLinks(card?.links ?? "");
    setCaseId(card?.caseId ? String(card.caseId) : "none");
    setIsFocus(card?.isFocus ?? false);
    setGroupId(String(card?.groupId ?? initialGroupId ?? groups[0]?.id ?? ""));
    setStatusId(String(card?.statusId ?? initialStatusId ?? statuses[0]?.id ?? ""));
  }, [open, card, initialGroupId, initialStatusId, groups, statuses]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !groupId || !statusId) return;
    if (!canEdit) return;
    await onSave({ title: title.trim(), description: description.trim(), role: role.trim(), dueDate, outcome: outcome.trim(), links: links.trim(), caseId: caseId === "none" ? null : Number(caseId), isFocus, groupId: Number(groupId), statusId: Number(statusId) });
  };

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-none border-black bg-[#f4f2fb] shadow-[10px_10px_0_#191919] sm:max-w-2xl">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader><DialogTitle className="font-serif text-3xl font-normal">{card ? "Мастер-карточка" : "Новая карточка"}</DialogTitle><DialogDescription>{canEdit ? "Задача, ответственность, результат и все материалы — в одном месте." : "Режим просмотра. Редактирование доступно владельцу."}</DialogDescription></DialogHeader>
          <label className="grid gap-2 text-sm font-semibold">Название<Input autoFocus={canEdit} disabled={!canEdit} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="h-11 rounded-none border-black bg-white text-base disabled:opacity-80" /></label>
          <label className="grid gap-2 text-sm font-semibold">Краткое описание<Textarea disabled={!canEdit} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} rows={3} placeholder="Суть задачи или гипотезы в 1–2 предложениях" className="resize-none rounded-none border-black bg-white text-base disabled:opacity-80" /></label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Роль / ответственный<Input disabled={!canEdit} value={role} onChange={(e) => setRole(e.target.value)} maxLength={100} placeholder="Например: Имя · роль" className="h-11 rounded-none border-black bg-white text-base disabled:opacity-80" /></label>
            <label className="grid gap-2 text-sm font-semibold">Срок<Input disabled={!canEdit} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 rounded-none border-black bg-white text-base disabled:opacity-80" /></label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Группа<Select disabled={!canEdit} value={groupId} onValueChange={(value) => value && setGroupId(value)}><SelectTrigger className="h-11 w-full rounded-none border-black bg-white"><SelectValue /></SelectTrigger><SelectContent>{groups.map((group) => <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>)}</SelectContent></Select></label>
            <label className="grid gap-2 text-sm font-semibold">Статус<Select disabled={!canEdit} value={statusId} onValueChange={(value) => value && setStatusId(value)}><SelectTrigger className="h-11 w-full rounded-none border-black bg-white"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status.id} value={String(status.id)}>{status.name}</SelectItem>)}</SelectContent></Select></label>
          </div>
          <div className="grid gap-4 border-t border-black/20 pt-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Результат / критерий готовности<Textarea disabled={!canEdit} value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={1200} rows={4} placeholder="Что должно получиться" className="resize-none rounded-none border-black bg-white disabled:opacity-80" /></label>
            <label className="grid gap-2 text-sm font-semibold">Ссылки и материалы<Textarea disabled={!canEdit} value={links} onChange={(e) => setLinks(e.target.value)} maxLength={1200} rows={4} placeholder="По одной ссылке на строку" className="resize-none rounded-none border-black bg-white disabled:opacity-80" /></label>
          </div>
          <div className="grid gap-4 border-t border-black/20 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="grid gap-2 text-sm font-semibold">Связанный кейс<Select disabled={!canEdit} value={caseId} onValueChange={(value) => value && setCaseId(value)}><SelectTrigger className="h-11 w-full rounded-none border-black bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Без кейса</SelectItem>{caseItems.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.title}</SelectItem>)}</SelectContent></Select></label>
            {caseId !== "none" ? <Button type="button" variant="outline" className="h-11 rounded-none border-black bg-transparent" asChild><Link href={`/cases/${caseId}`}>Открыть кейс <ArrowUpRight /></Link></Button> : card && canEdit ? <Button type="button" variant="outline" className="h-11 rounded-none border-black bg-transparent" onClick={async () => setCaseId(String(await onCreateCase(card)))}>Создать кейс</Button> : null}
          </div>
          <label className="flex cursor-pointer items-center gap-3 border border-black/30 bg-white/45 px-4 py-3 text-sm font-semibold"><Checkbox disabled={!canEdit} checked={isFocus} onCheckedChange={(checked) => setIsFocus(checked === true)} /><span><strong className="block uppercase tracking-[.08em]">Фокус недели</strong><span className="font-normal opacity-65">Показывать задачу в верхнем приоритетном ряду</span></span></label>
          <DialogFooter className="flex-row justify-between sm:justify-between">{canEdit && card ? <Button type="button" variant="ghost" size="icon" aria-label="Удалить карточку" onClick={() => setDeleting(true)}><Trash2 /></Button> : <span />}{canEdit ? <Button type="submit" className="rounded-none px-6">Сохранить</Button> : <Button type="button" className="rounded-none" asChild><a href="/signin-with-chatgpt?return_to=/" target="_top">Войти для редактирования</a></Button>}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <DeleteConfirm open={deleting} onOpenChange={setDeleting} title="Удалить карточку?" description="Это действие нельзя отменить." onConfirm={() => card && onDelete(card.id)} />
  </>;
}

function StructureEditor({ open, onOpenChange, board, onCreate, onRename, onDelete }: {
  open: boolean; onOpenChange: (open: boolean) => void; board: Board;
  onCreate: (entity: "group" | "status", name: string) => Promise<void>; onRename: (entity: "group" | "status", id: number, name: string) => Promise<void>; onDelete: (entity: "group" | "status", id: number) => Promise<void>;
}) {
  const [newGroup, setNewGroup] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ entity: "group" | "status"; id: number; name: string } | null>(null);
  const add = async (entity: "group" | "status") => {
    const value = entity === "group" ? newGroup : newStatus;
    if (!value.trim()) return;
    await onCreate(entity, value.trim());
    if (entity === "group") setNewGroup("");
    else setNewStatus("");
  };
  const list = (entity: "group" | "status") => {
    const items = entity === "group" ? board.groups : board.statuses;
    const value = entity === "group" ? newGroup : newStatus;
    const setValue = entity === "group" ? setNewGroup : setNewStatus;
    return <div className="grid gap-5 pt-4">
      <div className="grid gap-2">{items.map((item) => <div key={item.id} className="flex items-center gap-2 border-b border-black/20 pb-2">
        <Input defaultValue={item.name} aria-label={`Название: ${item.name}`} className="h-9 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" onBlur={(event) => event.target.value.trim() && event.target.value.trim() !== item.name && onRename(entity, item.id, event.target.value.trim())} />
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Удалить ${item.name}`} onClick={() => setDeleteTarget({ entity, id: item.id, name: item.name })}><Trash2 /></Button>
      </div>)}</div>
      <div className="flex gap-2"><Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={entity === "group" ? "Новая группа" : "Новый статус"} className="h-10 rounded-none border-black bg-white" onKeyDown={(event) => event.key === "Enter" && add(entity)} /><Button type="button" size="icon" className="rounded-none" aria-label="Добавить" onClick={() => add(entity)}><Plus /></Button></div>
    </div>;
  };
  return <>
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-none border-black bg-[#f4f2fb] shadow-[10px_10px_0_#191919] sm:max-w-lg"><DialogHeader><DialogTitle className="font-serif text-2xl font-normal">Структура доски</DialogTitle><DialogDescription>Переименовывай, добавляй и удаляй группы и колонки.</DialogDescription></DialogHeader><Tabs defaultValue="groups"><TabsList variant="line" className="w-full justify-start border-b border-black/20"><TabsTrigger value="groups">Группы</TabsTrigger><TabsTrigger value="statuses">Статусы</TabsTrigger></TabsList><TabsContent value="groups">{list("group")}</TabsContent><TabsContent value="statuses">{list("status")}</TabsContent></Tabs></DialogContent></Dialog>
    <DeleteConfirm open={Boolean(deleteTarget)} onOpenChange={(value) => !value && setDeleteTarget(null)} title={`Удалить «${deleteTarget?.name ?? ""}»?`} description="Все карточки внутри тоже удалятся." onConfirm={() => deleteTarget && onDelete(deleteTarget.entity, deleteTarget.id)} />
  </>;
}

export function BoardApp() {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [structureOpen, setStructureOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [initialStatusId, setInitialStatusId] = useState<number | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<number | null>(null);
  const applyBoard = useCallback((next: Board) => {
    const normalized = {
      ...emptyBoard,
      ...next,
      cards: (next.cards ?? []).map((card) => ({ outcome: "", links: "", caseId: null, isFocus: false, ...card })),
    };
    setBoard(normalized);
    window.localStorage.setItem(cacheKey, JSON.stringify(normalized));
  }, []);
  const load = useCallback(async () => { try { applyBoard(await request("GET")); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Не удалось загрузить доску"); } finally { setLoading(false); } }, [applyBoard]);
  useEffect(() => {
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) { setBoard(JSON.parse(cached)); setLoading(false); }
    } catch { window.localStorage.removeItem(cacheKey); }
    load();
  }, [load]);
  const mutate = async (method: string, body: Record<string, unknown>) => { try { const data = await request(method, body); if (data.groups && data.statuses && data.cards) applyBoard(data); else await load(); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Не удалось сохранить изменение"); throw err; } };
  const visibleCards = useMemo(() => activeTab === "all" ? board.cards : board.cards.filter((card) => card.groupId === Number(activeTab)), [activeTab, board.cards]);
  const focusCards = useMemo(() => board.cards.filter((card) => card.isFocus && board.statuses.find((status) => status.id === card.statusId)?.name.toLocaleLowerCase("ru") !== "архив").slice(0, 5), [board.cards, board.statuses]);
  const initialGroupId = activeTab === "all" ? board.groups[0]?.id ?? null : Number(activeTab);
  const openNewCard = (statusId?: number) => { if (!board.canEdit) return; setEditingCard(null); setInitialStatusId(statusId ?? board.statuses[0]?.id ?? null); setEditorOpen(true); };
  const saveCard = async (values: CardValues) => {
    const payload: Record<string, unknown> = { entity: "card", ...(editingCard ? { id: editingCard.id } : {}), ...values };
    if (editingCard?.statusId === values.statusId) delete payload.statusId;
    await mutate(editingCard ? "PATCH" : "POST", payload);
    setEditorOpen(false);
  };
  const deleteEntity = async (entity: Entity, id: number) => { await mutate("DELETE", { entity, id }); if (entity === "card") setEditorOpen(false); if (entity === "group" && activeTab === String(id)) setActiveTab("all"); };
  const moveCard = async (cardId: number, statusId: number) => { const card = board.cards.find((item) => item.id === cardId); if (!board.canEdit || !card || card.statusId === statusId) return; setBoard((current) => ({ ...current, cards: current.cards.map((item) => item.id === cardId ? { ...item, statusId } : item) })); try { await mutate("PATCH", { entity: "card", id: cardId, statusId }); } catch { await load(); } };
  const createCaseFromCard = async (card: Card) => {
    const response = await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: card.title, category: "Из карточки", hypothesis: card.description, action: card.outcome, stage: "Направление", period: new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date()) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Не удалось создать кейс");
    await mutate("PATCH", { entity: "card", id: card.id, caseId: data.case.id });
    return data.case.id as number;
  };

  return <main className="min-h-screen bg-[#b7bac2] text-[#151515]">
    <header className="board-header border-b border-black">
      <div className="brand-rail" aria-hidden="true"><span>М</span><span>А</span><span>Т</span><span>Е</span><span>Р</span><span>И</span><span>Я</span></div>
      <div className="board-header-main"><div className="brand-lockup"><div className="brand-word"><span>М</span>ИСТЕРИЯ</div><div className="brand-os">OS</div><div className="brand-lab"><strong>AIAIAI</strong><span>lab</span></div></div><div className="board-actions"><nav className="module-nav" aria-label="Разделы"><Link href="/" className="is-active">KANBAN</Link><Link href="/cases">CASES</Link><Link href="/operations">OPERATIONS</Link></nav>{board.canEdit ? <><Button variant="outline" className="board-action-button" onClick={() => setStructureOpen(true)}>Структура</Button><Button className="board-action-button board-action-button--primary" onClick={() => openNewCard()}>+&nbsp;&nbsp;Карточка</Button></> : <a href="/signin-with-chatgpt?return_to=/" target="_top" className="view-mode-button">Просмотр · войти</a>}</div></div>
    </header>
    <section className="board-content">
      {error && <div className="mb-4 border border-black bg-[#ffd9da] px-4 py-3 text-sm">{error}</div>}
      {loading ? <div className="lavender-panel flex min-h-[55vh] items-center justify-center font-serif text-2xl">Загружаю доску…</div> : <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-5">
        {(focusCards.length > 0 || board.canEdit) && <section className="focus-strip">
          <div className="focus-strip-label"><Star aria-hidden="true" /><span>Фокус<br />недели</span></div>
          <div className="focus-strip-cards">{focusCards.length > 0 ? focusCards.map((card) => {
            const status = board.statuses.find((item) => item.id === card.statusId);
            return <button key={card.id} onClick={() => { setEditingCard(card); setEditorOpen(true); }}><strong>{card.title}</strong><span>{status?.name}{card.dueDate ? ` · до ${formatDueDate(card.dueDate)}` : ""}</span></button>;
          }) : <div className="focus-strip-empty">Отметь важные карточки флажком «Фокус недели»</div>}</div>
        </section>}
        <div className="board-filters scrollbar-none"><TabsList variant="line"><TabsTrigger value="all">Все <span>{board.cards.length}</span></TabsTrigger>{board.groups.map((group) => <TabsTrigger key={group.id} value={String(group.id)}>{group.name} <span>{board.cards.filter((card) => card.groupId === group.id).length}</span></TabsTrigger>)}</TabsList></div>
        <TabsContent value={activeTab} className="mt-0"><div className="kanban-grid scrollbar-thin">{board.statuses.map((status, statusIndex) => { const cards = visibleCards.filter((card) => card.statusId === status.id); return <section key={status.id} className={`kanban-column ${status.name.toLocaleLowerCase("ru") === "архив" ? "kanban-column--archive" : ""}`} onDragOver={(event) => board.canEdit && event.preventDefault()} onDrop={() => draggedCardId && moveCard(draggedCardId, status.id)}>
          <div className="flex items-center justify-between border-b border-black/30 pb-3"><div className="flex items-baseline gap-2"><span className="font-serif text-2xl">{String(statusIndex + 1).padStart(2, "0")}</span><h2 className="text-sm font-bold uppercase tracking-[.08em]">{status.name}</h2><span className="text-sm opacity-50">{cards.length}</span></div>{board.canEdit && <Button variant="ghost" size="icon-sm" aria-label={`Добавить в ${status.name}`} onClick={() => openNewCard(status.id)}><Plus /></Button>}</div>
          <div className="grid gap-3 pt-3">
            {cards.map((card) => {
              const group = board.groups.find((item) => item.id === card.groupId);
              const linkedCase = board.cases.find((item) => item.id === card.caseId);
              return <article key={card.id} draggable={board.canEdit} onDragStart={() => board.canEdit && setDraggedCardId(card.id)} onDragEnd={() => setDraggedCardId(null)} className={`kanban-card ${card.isFocus ? "kanban-card--focus" : ""}`}>
                  <button className="block w-full min-w-0 text-left" onClick={() => { setEditingCard(card); setEditorOpen(true); }}>
                    {card.isFocus && <span className="card-focus"><Star aria-hidden="true" />Фокус</span>}
                    <h3 className="card-title">{card.title}</h3>
                    {card.description && <p className="card-description">{card.description}</p>}
                    <div className="card-meta">
                      {activeTab === "all" && <span className="card-group">{group?.name}</span>}
                      {card.role && <span className="card-detail"><UserRound aria-hidden="true" />{card.role}</span>}
                      {card.dueDate && <span className="card-detail"><CalendarDays aria-hidden="true" />{formatDueDate(card.dueDate)}</span>}
                      {linkedCase && <span className="card-detail"><Link2 aria-hidden="true" />{linkedCase.title}</span>}
                    </div>
                  </button>
              </article>;
            })}
            {cards.length === 0 && board.canEdit && <button onClick={() => openNewCard(status.id)} className="min-h-20 border border-dashed border-black/30 text-sm opacity-55 transition hover:bg-white/30 hover:opacity-100">+ Добавить</button>}
          </div>
        </section>; })}</div></TabsContent>
      </Tabs>}
    </section>
    <CardEditor card={editingCard} initialGroupId={initialGroupId} initialStatusId={initialStatusId} groups={board.groups} statuses={board.statuses} caseItems={board.cases} canEdit={board.canEdit} open={editorOpen} onOpenChange={setEditorOpen} onSave={saveCard} onDelete={(id) => deleteEntity("card", id)} onCreateCase={createCaseFromCard} />
    {board.canEdit && <StructureEditor open={structureOpen} onOpenChange={setStructureOpen} board={board} onCreate={(entity, name) => mutate("POST", { entity, name })} onRename={(entity, id, name) => mutate("PATCH", { entity, id, name })} onDelete={(entity, id) => deleteEntity(entity, id)} />}
  </main>;
}
