"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Clock3, Gauge, Sparkles } from "lucide-react";

const days = ["ПН", "ВТ", "СР", "ЧТ", "ПТ"];

const rows = [
  { title: "План недели", meta: "Фиксация задач и ожидаемого результата", start: 1, span: 1, tone: "bg-[#151515] text-white" },
  { title: "ТЭП · проверка прототипа", meta: "План: 2 дня · факт: 3 дня", start: 1, span: 3, tone: "bg-[#b7a6ef]" },
  { title: "Удалённая машина", meta: "Ожидание доступа · блокер", start: 2, span: 2, tone: "bg-[#ffd9da]" },
  { title: "Materia OS", meta: "Операционный модуль · прототип", start: 3, span: 2, tone: "bg-[#d9cff5]" },
  { title: "Итоги недели", meta: "План / факт / причины / следующий цикл", start: 5, span: 1, tone: "bg-[#151515] text-white" },
];

const events = [
  { date: "23.09", type: "РЕШЕНИЕ", title: "Добавить операционный слой в Materia OS", note: "Не только задачи, но и история изменений, причин и влияния на сроки." },
  { date: "23.09", type: "БЛОКЕР", title: "Доступ к удалённой машине ещё не подтверждён", note: "Влияет на тесты, завязанные на корпоративную инфраструктуру." },
  { date: "22.09", type: "ИЗМЕНЕНИЕ", title: "Приоритет смещён на системную работу отдела", note: "Нужна самостоятельная инициация процессов и более формальный цикл R&D." },
  { date: "21.09", type: "УСКОРЕНИЕ", title: "Часть проверки ТЭП автоматизирована", note: "Потенциально сокращает ручную проверку; эффект ещё нужно подтвердить на нескольких моделях." },
];

export function OperationsApp() {
  return <main className="min-h-screen bg-[#b7bac2] text-[#151515]">
    <header className="board-header border-b border-black">
      <div className="brand-rail" aria-hidden="true"><span>М</span><span>А</span><span>Т</span><span>Е</span><span>Р</span><span>И</span><span>Я</span></div>
      <div className="board-header-main">
        <div className="brand-lockup"><div className="brand-word"><span>М</span>ИСТЕРИЯ</div><div className="brand-os">OS</div><div className="brand-lab"><strong>OPS</strong><span>beta</span></div></div>
        <div className="board-actions">
          <nav className="module-nav" aria-label="Разделы"><Link href="/">KANBAN</Link><Link href="/cases">CASES</Link><Link href="/operations" className="is-active">OPERATIONS</Link></nav>
        </div>
      </div>
    </header>

    <section className="px-4 py-5 sm:px-7 sm:py-7">
      <div className="mb-5 flex flex-col gap-4 border-b border-black/50 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex border border-black px-2 py-1 text-[11px] font-bold uppercase tracking-[.12em]">Демо · заготовка</div>
          <h1 className="font-serif text-[clamp(2.8rem,6vw,6rem)] font-normal leading-[.9] tracking-[-.04em]">Операционная неделя</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed opacity-70">Планируем работу в начале недели, фиксируем события по ходу проекта и в конце видим не только факт, но и причины отклонений. Следующий слой — автоматический поиск повторяющихся сбоев и ускорений.</p>
        </div>
        <div className="text-right font-mono text-xs uppercase leading-relaxed opacity-60">21—25 сентября 2026<br/>AI / R&D · прототип</div>
      </div>

      <div className="mb-5 grid border border-black bg-black sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["12", "План", "задач на неделю"],
          ["08", "Факт", "в работе / завершено"],
          ["+2", "Сдвиг", "дня по блокерам"],
          ["03", "События", "повлияли на план"],
        ].map(([value, label, note]) => <div key={label} className="min-h-36 bg-[#f7f7f5] p-4 sm:p-5">
          <div className="font-serif text-5xl leading-none">{value}</div>
          <div className="mt-5 text-xs font-bold uppercase tracking-[.12em]">{label}</div>
          <div className="mt-1 text-xs opacity-55">{note}</div>
        </div>)}
      </div>

      <section className="mb-5 border border-black bg-[#d9cff5]">
        <div className="flex flex-col gap-3 border-b border-black p-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="text-xs font-bold uppercase tracking-[.12em]">01 · План → факт</div><h2 className="mt-1 font-serif text-3xl">Живой timeline проекта</h2></div>
          <div className="text-xs opacity-60">Сейчас вручную · дальше события собираются автоматически</div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-[280px_repeat(5,1fr)] border-b border-black/40">
              <div className="p-3 text-xs font-bold uppercase tracking-[.1em]">Процесс</div>
              {days.map((day) => <div key={day} className="border-l border-black/25 p-3 text-center text-xs font-bold">{day}</div>)}
            </div>
            {rows.map((row) => <div key={row.title} className="grid min-h-20 grid-cols-[280px_repeat(5,1fr)] border-b border-black/25 last:border-b-0">
              <div className="p-3"><strong className="block text-sm">{row.title}</strong><span className="mt-1 block text-xs opacity-55">{row.meta}</span></div>
              <div className="relative col-span-5 grid grid-cols-5 border-l border-black/25">
                {days.map((day) => <div key={day} className="border-r border-black/15 last:border-r-0" />)}
                <div className={`absolute inset-y-4 flex items-center px-3 text-xs font-bold ${row.tone}`} style={{ left: `calc(${(row.start - 1) * 20}% + 6px)`, width: `calc(${row.span * 20}% - 12px)` }}>
                  {row.title}
                </div>
              </div>
            </div>)}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <section className="border border-black bg-[#f7f7f5]">
          <div className="border-b border-black p-4"><div className="text-xs font-bold uppercase tracking-[.12em]">02 · Контекст</div><h2 className="mt-1 font-serif text-3xl">Журнал событий</h2></div>
          <div>
            {events.map((event) => <article key={event.date + event.title} className="grid gap-3 border-b border-black/25 p-4 last:border-b-0 md:grid-cols-[70px_105px_1fr]">
              <div className="font-mono text-xs">{event.date}</div>
              <div><span className="inline-block border border-black px-2 py-1 text-[10px] font-bold tracking-[.08em]">{event.type}</span></div>
              <div><strong className="text-sm">{event.title}</strong><p className="mt-1 max-w-2xl text-xs leading-relaxed opacity-60">{event.note}</p></div>
            </article>)}
          </div>
        </section>

        <section className="border border-black bg-[#151515] text-white">
          <div className="border-b border-white/40 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em]"><Sparkles className="size-4" />03 · AI analysis</div><h2 className="mt-1 font-serif text-3xl">Что система должна замечать</h2></div>
          <div className="grid gap-px bg-white/25">
            <div className="bg-[#151515] p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0"/><div><strong className="text-sm">Риск</strong><p className="mt-1 text-xs leading-relaxed opacity-65">Задача зависит от внешнего доступа. Сдвиг инфраструктуры автоматически переносит связанные тесты.</p></div></div></div>
            <div className="bg-[#151515] p-4"><div className="flex gap-3"><Clock3 className="mt-0.5 size-5 shrink-0"/><div><strong className="text-sm">Отклонение</strong><p className="mt-1 text-xs leading-relaxed opacity-65">План и факт расходятся. Система сохраняет не только +2 дня, но и причину изменения.</p></div></div></div>
            <div className="bg-[#151515] p-4"><div className="flex gap-3"><Gauge className="mt-0.5 size-5 shrink-0"/><div><strong className="text-sm">Ускорение</strong><p className="mt-1 text-xs leading-relaxed opacity-65">Если этап стабильно проходит быстрее плана, система предлагает скорректировать будущие оценки.</p></div></div></div>
            <div className="bg-[#151515] p-4"><div className="flex gap-3"><Check className="mt-0.5 size-5 shrink-0"/><div><strong className="text-sm">Память процесса</strong><p className="mt-1 text-xs leading-relaxed opacity-65">Через несколько проектов можно увидеть повторяющиеся причины задержек, а не обсуждать их каждый раз заново.</p></div></div></div>
          </div>
        </section>
      </div>

      <section className="mt-5 border border-black bg-[#c9bdf0] p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div><div className="text-xs font-bold uppercase tracking-[.12em]">04 · Цикл</div><h2 className="mt-1 font-serif text-3xl">Как это работает</h2></div>
          <div className="grid gap-1 sm:grid-cols-4">
            {[
              ["ПОНЕДЕЛЬНИК", "Фиксируем план и ожидаемый результат"],
              ["В ТЕЧЕНИЕ НЕДЕЛИ", "Сохраняем решения, изменения и блокеры"],
              ["ПЯТНИЦА", "Сравниваем план / факт и обсуждаем причины"],
              ["СЛЕДУЮЩИЙ ЦИКЛ", "Система использует накопленную историю"],
            ].map(([title, note], index) => <div key={title} className="relative border border-black bg-[#f7f7f5] p-4">
              <div className="mb-8 font-serif text-3xl">{String(index + 1).padStart(2, "0")}</div>
              <strong className="text-xs tracking-[.08em]">{title}</strong><p className="mt-2 text-xs leading-relaxed opacity-60">{note}</p>
              {index < 3 && <ArrowRight className="absolute -right-3 top-5 z-10 hidden size-5 bg-[#f7f7f5] sm:block" />}
            </div>)}
          </div>
        </div>
      </section>
    </section>
  </main>;
}
