"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

type CaseImage = { id: number; caseId: number; filename: string; contentType: string; position: number; createdAt: string };

export function CaseDetailApp() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [item, setItem] = useState<Case | null>(null);
  const [images, setImages] = useState<CaseImage[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Case | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id < 1) return;
    try {
      const [caseResponse, imagesResponse] = await Promise.all([fetch(`/api/cases?id=${id}`), fetch(`/api/case-images?caseId=${id}`)]);
      const caseData = await caseResponse.json();
      const imagesData = await imagesResponse.json();
      if (!caseResponse.ok) throw new Error(caseData.error || "Кейс не найден");
      if (!imagesResponse.ok) throw new Error(imagesData.error || "Не удалось загрузить изображения");
      setItem(caseData.case);
      setDraft(caseData.case);
      setCanEdit(caseData.canEdit === true);
      setImages(imagesData.images);
      setActiveId((current) => current && imagesData.images.some((image: CaseImage) => image.id === current) ? current : imagesData.images[0]?.id ?? null);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось открыть кейс"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (files: FileList | null) => {
    if (!canEdit || !files?.length) return;
    setUploading(true);
    setError("");
    try {
      let next = images;
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("caseId", String(id));
        form.set("file", file);
        const response = await fetch("/api/case-images", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Не удалось загрузить ${file.name}`);
        next = data.images;
      }
      setImages(next);
      setActiveId((current) => current ?? next[0]?.id ?? null);
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось загрузить изображения"); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const removeImage = async (imageId: number) => {
    if (!window.confirm("Удалить это изображение?")) return;
    try {
      const response = await fetch("/api/case-images", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: imageId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось удалить изображение");
      setImages(data.images);
      setActiveId(data.images[0]?.id ?? null);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось удалить изображение"); }
  };

  const saveCase = async () => {
    if (!canEdit || !draft?.title.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Не удалось сохранить кейс");
      setItem(draft);
      setEditing(false);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Не удалось сохранить кейс"); }
    finally { setSaving(false); }
  };

  if (loading) return <main className="project-page grid min-h-screen place-items-center"><div className="font-serif text-3xl">Открываю кейс…</div></main>;
  if (!item) return <main className="project-page grid min-h-screen place-items-center px-5 text-center"><div><div className="font-serif text-4xl">Кейс не найден</div><p className="mt-3">{error}</p><Link href="/cases" className="mt-6 inline-block border border-black px-4 py-3 font-bold uppercase">Вернуться к кейсам</Link></div></main>;

  const active = images.find((image) => image.id === activeId) ?? images[0];
  const sections: Array<[string, string, "hypothesis" | "action" | "result" | "takeaway"]> = [
    ["01", "Гипотеза", "hypothesis"],
    ["02", "Что сделали", "action"],
    ["03", "Результат", "result"],
    ["04", "Вывод", "takeaway"],
  ];

  return <main className="project-page min-h-screen">
    <header className="project-topbar">
      <Link href="/cases" className="flex items-center gap-2 font-bold uppercase tracking-[.08em]"><ArrowLeft className="size-4" />Все кейсы</Link>
      <div className="project-topbar-right">
        {canEdit && (editing ? <div className="project-edit-actions"><Button variant="outline" className="rounded-none border-black bg-transparent" onClick={() => { setDraft(item); setEditing(false); }}><X />Отмена</Button><Button className="rounded-none" disabled={saving} onClick={saveCase}><Save />{saving ? "Сохраняю…" : "Сохранить"}</Button></div> : <Button variant="outline" className="rounded-none border-black bg-transparent" onClick={() => { setDraft(item); setEditing(true); }}><Pencil />Редактировать</Button>)}
        <div className="project-mark"><strong>МИСТЕРИЯ</strong><span>CASES</span><em>AIAIAI lab</em></div>
      </div>
    </header>
    <article className="project-shell">
      <div className="project-intro">
        {editing && draft ? <>
          <div className="project-edit-meta"><Input aria-label="Категория" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /><Input aria-label="Период" value={draft.period} onChange={(event) => setDraft({ ...draft, period: event.target.value })} /><Input aria-label="Этап" value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value })} /></div>
          <Input className="project-edit-title" aria-label="Название кейса" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </> : <><div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-[.12em]"><span>{item.category}</span><span>·</span><span>{item.period}</span><span className="case-stage case-stage--done">{item.stage}</span></div><h1>{item.title}</h1></>}
      </div>

      {error && <div className="mx-auto mb-4 max-w-5xl border border-black bg-[#ffd9da] px-4 py-3 text-sm">{error}</div>}

      <section className="project-gallery" aria-label="Изображения проекта">
        {active ? <div className="project-hero-image"><img src={`/api/case-image?id=${active.id}`} alt={active.filename} />{canEdit && <Button variant="secondary" size="icon" className="absolute right-3 top-3 rounded-none border border-black" aria-label="Удалить изображение" onClick={() => removeImage(active.id)}><Trash2 /></Button>}</div> : canEdit ? <button className="project-empty-image" onClick={() => inputRef.current?.click()}><ImagePlus /><strong>Добавить изображения</strong><span>Они появятся здесь как галерея проекта</span></button> : <div className="project-empty-image"><ImagePlus /><strong>Галерея пока пуста</strong><span>Изображения добавит автор проекта</span></div>}
        <div className="project-gallery-controls">
          <div className="project-thumbnails">{images.map((image) => <button key={image.id} className={active?.id === image.id ? "is-active" : ""} onClick={() => setActiveId(image.id)}><img src={`/api/case-image?id=${image.id}`} alt={image.filename} /></button>)}</div>
          {canEdit ? <><Button variant="outline" className="shrink-0 rounded-none border-black bg-transparent" disabled={uploading} onClick={() => inputRef.current?.click()}><Upload />{uploading ? "Загружаю…" : "Добавить фото"}</Button><input ref={inputRef} className="sr-only" type="file" accept="image/*" multiple onChange={(event) => uploadFiles(event.target.files)} /></> : <a href={`/signin-with-chatgpt?return_to=/cases/${id}`} target="_top" className="view-mode-button shrink-0">Просмотр · войти</a>}
        </div>
      </section>

      <section className="project-story">{sections.map(([number, title, key]) => <div key={number} className="project-section"><div className="project-section-label"><span>{number}</span><h2>{title}</h2></div>{editing && draft ? <Textarea className="project-edit-textarea" value={draft[key]} maxLength={500} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /> : <p>{item[key] || "Пока не заполнено."}</p>}</div>)}</section>
    </article>
  </main>;
}
