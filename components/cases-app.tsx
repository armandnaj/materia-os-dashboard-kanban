"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Case = {
  id: number;
  title: string;
  category: string;
  hypothesis: string;
  action: string;
  result: string;
  takeaway: string;
  stage: string;
  period: string;
};

type CaseValues = Omit<Case, "id">;
const empty: CaseValues = { title: "", category: "Рендеры", hypothesis: "", action: "", result: "", takeaway: "", stage: "Проверено", period: "" };
const cacheKey = "mystery-cases-cache-v1";

async function request(method: string, body?: Record<string, unknown>) {
  const response = await fetch("/api/cases", {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Не удалось сохранить кейс");
  return data as { cases: Case[]; canEdit: boolean; case?: Case };
}

function BrandHeader({ onAdd, canEdit }: { onAdd: () => void; canEdit: boolean }) {
  return <header className="border-b border-black px-4 pt-4 sm:px-7 sm:pt-6">
    <div className="brand-rail" aria-hidden="true"><span>М</span><span>А</span><span>Т</span><span>Е</span><span>Р</span><span>И</span><span>Я</span></div>
    <div className="flex flex-col gap-6 py-6 sm:flex-row sm:items-end sm:justify-between sm:py-8">
      <div className="brand-lockup"><div className="brand-word">МИСТЕРИЯ</div><div className="brand-os">CASES</div><div className="brand-lab">AIAIAI <span>lab</span></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <nav className="module-nav" aria-label="Разделы"><Link href="/">KANBAN</Link><Link href="/cases" className="is-active">CASES</Link></nav>
        {canEdit ? <Button className="h-11 rounded-none" onClick={onAdd}><Plus />Кейс</Button> : <a href="/signin-with-chatgpt?return_to=/cases" target="_top" className="view-mode-button">Просмотр · войти</a>}
      </div>
    </div>
  </header>;
}

function CaseEditor({ value, open, onOpenChange, onSave, onDelete }: {
  value: Case | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CaseValues) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [form, setForm] = useState<CaseValues>(empty);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (open) setForm(value ? { title: value.title, category: value.category, hypothesis: value.hypothesis, action: value.action, result: value.result, takeaway: value.takeaway, stage: value.stage, period: value.period } : empty);
  }, [open, value]);
  const set = (key: keyof CaseValues, next: string) => setForm((current) => ({ ...current, [key]: next }));
  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-black bg-[#f4f2fb] shadow-[10px_10px_0_#191919] sm:max-w-2xl">
        <form className="grid gap-5" onSubmit={async (event) => { event.preventDefault(); if (form.title.trim()) await onSave(form); }}>
          <DialogHeader><DialogTitle className="font-serif text-3xl font-normal">{value ? value.title : "Новый кейс"}</DialogTitle><DialogDescription>Зафиксируй проверку так, чтобы её можно было быстро показать и повторить.</DialogDescription></DialogHeader>
          <label className="case-field">Название<Input autoFocus value={form.title} onChange={(event) => set("title", event.target.value)} maxLength={120} /></label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="case-field">Категория<Input value={form.category} onChange={(event) => set("category", event.target.value)} maxLength={60} /></label>
            <label className="case-field">Этап<Select value={form.stage} onValueChange={(next) => next && set("stage", next)}><SelectTrigger className="h-11 w-full rounded-none border-black bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Проверено">Проверено</SelectItem><SelectItem value="Тестируется">Тестируется</SelectItem><SelectItem value="Гипотеза">Гипотеза</SelectItem><SelectItem value="Направление">Направление</SelectItem></SelectContent></Select></label>
            <label className="case-field">Период<Input value={form.period} onChange={(event) => set("period", event.target.value)} maxLength={40} placeholder="Сентябрь 2026" /></label>
          </div>
          <label className="case-field">Гипотеза<Textarea value={form.hypothesis} onChange={(event) => set("hypothesis", event.target.value)} maxLength={500} rows={2} /></label>
          <label className="case-field">Что сделали<Textarea value={form.action} onChange={(event) => set("action", event.target.value)} maxLength={500} rows={2} /></label>
          <label className="case-field">Результат<Textarea value={form.result} onChange={(event) => set("result", event.target.value)} maxLength={500} rows={2} /></label>
          <label className="case-field">Вывод<Textarea value={form.takeaway} onChange={(event) => set("takeaway", event.target.value)} maxLength={500} rows={2} /></label>
          <DialogFooter className="flex-row justify-between sm:justify-between">{value ? <Button type="button" variant="ghost" size="icon" aria-label="Удалить кейс" onClick={() => setDeleting(true)}><Trash2 /></Button> : <span />}<Button className="rounded-none px-7" type="submit">Сохранить</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={deleting} onOpenChange={setDeleting}><AlertDialogContent className="rounded-none border-black bg-[#f4f2fb] shadow-[8px_8px_0_#191919]"><AlertDialogHeader><AlertDialogTitle>Удалить кейс?</AlertDialogTitle><AlertDialogDescription>Он исчезнет из библиотеки.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-none border-black bg-transparent">Отмена</AlertDialogCancel><AlertDialogAction variant="destructive" className="rounded-none" onClick={() => value && onDelete(value.id)}>Удалить</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}

export function CasesApp() {
  const [items, setItems] = useState<Case[]>([]);
  const [filter, setFilter] = useState("Все");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Case | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const apply = useCallback((next: Case[]) => { setItems(next); window.localStorage.setItem(cacheKey, JSON.stringify(next)); }, []);
  const load = useCallback(async () => {
    try { const data = await request("GET"); apply(data.cases); setCanEdit(data.canEdit); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось загрузить кейсы"); }
    finally { setLoading(false); }
  }, [apply]);
  useEffect(() => {
    try { const cached = window.localStorage.getItem(cacheKey); if (cached) { setItems(JSON.parse(cached)); setLoading(false); } } catch { window.localStorage.removeItem(cacheKey); }
    load();
  }, [load]);
  const categories = useMemo(() => ["Все", ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const visible = filter === "Все" ? items : items.filter((item) => item.category === filter);
  const save = async (values: CaseValues) => {
    try { const data = await request(editing ? "PATCH" : "POST", { ...(editing ? { id: editing.id } : {}), ...values }); apply(data.cases); setCanEdit(data.canEdit); setEditorOpen(false); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось сохранить кейс"); }
  };
  const remove = async (id: number) => {
    try { const data = await request("DELETE", { id }); apply(data.cases); setCanEdit(data.canEdit); setEditorOpen(false); setEditing(null); setError(""); }
    catch (err) { setError(err instanceof Error ? err.message : "Не удалось удалить кейс"); }
  };
  return <main className="min-h-screen bg-[#b7bac2] text-[#151515]">
    <BrandHeader canEdit={canEdit} onAdd={() => { setEditing(null); setEditorOpen(true); }} />
    <section className="px-4 py-5 sm:px-7 sm:py-7">
      {error && <div className="mb-4 border border-black bg-[#ffd9da] px-4 py-3 text-sm">{error}</div>}
      <div className="mb-5 flex flex-col gap-4 border-b border-black/50 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="font-serif text-4xl leading-none sm:text-5xl">Библиотека кейсов</div><p className="mt-2 max-w-xl text-sm opacity-65">Проверенные эксперименты, рабочие гипотезы и направления за первый месяц.</p></div>
        <div className="case-count"><strong>{String(items.length).padStart(2, "0")}</strong><span>кейсов<br />за месяц</span></div>
      </div>
      <div className="scrollbar-none mb-5 overflow-x-auto"><div className="flex min-w-max gap-2">{categories.map((category) => <button key={category} onClick={() => setFilter(category)} className={`case-filter ${filter === category ? "is-active" : ""}`}>{category} <span>{category === "Все" ? items.length : items.filter((item) => item.category === category).length}</span></button>)}</div></div>
      {loading && items.length === 0 ? <div className="lavender-panel flex min-h-[50vh] items-center justify-center font-serif text-2xl">Загружаю кейсы…</div> : <div className="case-grid">
        {visible.map((item, index) => <article key={item.id} className="case-tile group">
          <Link href={`/cases/${item.id}`} className="flex h-full w-full flex-col text-left">
            <div className="flex items-start justify-between gap-3"><span className="case-index">{String(index + 1).padStart(2, "0")}</span><span className={`case-stage case-stage--${item.stage === "Проверено" ? "done" : "open"}`}>{item.stage}</span></div>
            <div className="mt-auto pt-12"><div className="mb-3 text-xs font-bold uppercase tracking-[.12em] opacity-55">{item.category}{item.period ? ` · ${item.period}` : ""}</div><h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[.96]">{item.title}</h2>{item.result && <p className="mt-5 max-w-xl text-sm leading-relaxed opacity-70">{item.result}</p>}<div className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-[.08em]">Открыть <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></div></div>
          </Link>
          {canEdit && <Button variant="ghost" size="icon-sm" className="absolute right-3 top-12 opacity-0 group-hover:opacity-100" aria-label="Редактировать кейс" onClick={() => { setEditing(item); setEditorOpen(true); }}><MoreHorizontal /></Button>}
        </article>)}
        {canEdit && <button className="case-tile case-tile--new" onClick={() => { setEditing(null); setEditorOpen(true); }}><Plus className="size-7" /><span>Добавить кейс</span></button>}
      </div>}
    </section>
    {canEdit && <CaseEditor value={editing} open={editorOpen} onOpenChange={setEditorOpen} onSave={save} onDelete={remove} />}
  </main>;
}
