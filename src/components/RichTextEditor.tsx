'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

interface Props {
  initialHtml: string;
  onChange: (html: string) => void;
  label?: string;
}

const INLINE: { key: string; glyph: string; label: string; cls: string }[] = [
  { key: 'bold', glyph: 'B', label: 'Жирний (Ctrl+B)', cls: 'font-extrabold' },
  { key: 'italic', glyph: 'I', label: 'Курсив (Ctrl+I)', cls: 'italic' },
  { key: 'underline', glyph: 'U', label: 'Підкреслений (Ctrl+U)', cls: 'underline' },
  { key: 'strikeThrough', glyph: 'S', label: 'Закреслений', cls: 'line-through' },
];
const COLORS = [
  ['#16241D', 'Темний текст'],
  ['#2F6B4F', 'Зелений текст'],
  ['#C2410C', 'Помаранчевий текст'],
  ['#A33A2B', 'Червоний текст'],
] as const;
const MARKS = [
  ['#FFF1D6', 'Жовтий маркер'],
  ['#DCEBE2', 'Зелений маркер'],
] as const;

/**
 * Редактор з форматуванням окремих слів: виділи слово — і зроби його жирним, закресленим, кольоровим чи хвилястим.
 * Працює на contentEditable + execCommand (підтримують усі сучасні браузери). Результат проходить sanitizeHtml.
 */
export function RichTextEditor({ initialHtml, onChange, label = 'Опис заняття' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [linkOpen, setLinkOpen] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = sanitizeHtml(initialHtml);
    // вміст задаємо лише раз — далі ним керує браузер
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const sync = useCallback(() => {
    const next: Record<string, boolean> = {};
    for (const i of INLINE) {
      try {
        next[i.key] = document.queryCommandState(i.key);
      } catch {
        next[i.key] = false;
      }
    }
    setActive(next);
  }, []);

  /** Одна функція для всіх кнопок: команда береться з data-атрибутів, тож обробник не створюється під час рендеру. */
  const onTool = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const { cmd, value, css } = e.currentTarget.dataset;
    if (!cmd) return;
    ref.current?.focus();
    try {
      document.execCommand('styleWithCSS', false, css ? 'true' : 'false');
      document.execCommand(cmd, false, value);
    } catch {
      /* старий браузер */
    }
    sync();
    emit();
  };


  const openLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const sel = window.getSelection();
    saved.current = sel && sel.rangeCount && !sel.isCollapsed && ref.current?.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    setHasSelection(!!saved.current);
    setLinkOpen(true);
  };

  const applyLink = (e: React.FormEvent) => {
    e.preventDefault();
    const v = url.trim();
    if (saved.current && v) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(saved.current);
      document.execCommand('createLink', false, /^https?:\/\//i.test(v) ? v : `https://${v}`);
      emit();
    }
    setUrl('');
    setLinkOpen(false);
  };

  const btn = 'flex h-10 min-w-10 items-center justify-center rounded-[10px] px-2.5 text-[15px]';

  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Форматування тексту" className="flex flex-wrap items-center gap-1 rounded-2xl bg-ink p-1.5 text-white">
        <button type="button" onMouseDown={onTool} data-cmd="formatBlock" data-value="p" className={`${btn} font-semibold hover:bg-white/10`}>Текст</button>
        <button type="button" onMouseDown={onTool} data-cmd="formatBlock" data-value="h3" className={`${btn} font-head font-extrabold hover:bg-white/10`}>Заголовок</button>
        <button type="button" onMouseDown={onTool} data-cmd="fontName" data-value="Comfortaa" data-css="1" className={`${btn} font-wave font-bold hover:bg-white/10`}>Хвилястий</button>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-white/20" />
        {INLINE.map((i) => (
          <button
            key={i.key}
            type="button"
            onMouseDown={onTool} data-cmd={i.key}
            aria-label={i.label}
            aria-pressed={!!active[i.key]}
            title={i.label}
            className={`${btn} w-10 font-serif text-[17px] ${i.cls} ${active[i.key] ? 'bg-amber text-ink' : 'hover:bg-white/10'}`}
          >
            {i.glyph}
          </button>
        ))}
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-white/20" />
        {COLORS.map(([c, l]) => (
          <button key={c} type="button" onMouseDown={onTool} data-cmd="foreColor" data-value={c} data-css="1" aria-label={l} title={l} className="h-8 w-8 rounded-[9px] border-2 border-white/40" style={{ background: c }} />
        ))}
        {MARKS.map(([c, l]) => (
          <button key={c} type="button" onMouseDown={onTool} data-cmd="hiliteColor" data-value={c} data-css="1" aria-label={l} title={l} className="h-8 rounded-[9px] px-2 text-[13px] font-extrabold text-ink" style={{ background: c }}>
            ab
          </button>
        ))}
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-white/20" />
        <button type="button" onMouseDown={onTool} data-cmd="insertUnorderedList" className={`${btn} font-bold hover:bg-white/10`}>• Список</button>
        <button type="button" onMouseDown={onTool} data-cmd="insertOrderedList" className={`${btn} font-bold hover:bg-white/10`}>1. Список</button>
        <button type="button" onMouseDown={openLink} className={`${btn} font-bold hover:bg-white/10`}>Посилання</button>
        <button type="button" onMouseDown={onTool} data-cmd="removeFormat" className={`${btn} font-bold hover:bg-white/10`}>Очистити</button>
        <button type="button" onMouseDown={onTool} data-cmd="undo" aria-label="Скасувати дію" className={`${btn} hover:bg-white/10`}>↶</button>
        <button type="button" onMouseDown={onTool} data-cmd="redo" aria-label="Повторити дію" className={`${btn} hover:bg-white/10`}>↷</button>
      </div>
      {linkOpen && (
        <form onSubmit={applyLink} className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-soft p-2.5">
          <input
            type="url"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Адреса посилання"
            placeholder="https://instagram.com/…"
            className="field h-11 min-w-[220px] flex-1"
          />
          <button type="submit" className="btn-primary h-11 text-sm">Додати</button>
          <button type="button" onClick={() => setLinkOpen(false)} className="btn h-11 px-3 text-sm text-ink-2">Скасувати</button>
          {!hasSelection && <span className="w-full text-xs text-muted">Спершу виділіть слово в тексті, яке стане посиланням.</span>}
        </form>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        spellCheck
        onInput={emit}
        onKeyUp={sync}
        onMouseUp={sync}
        onBlur={emit}
        className="rich min-h-[260px] rounded-[20px] border-[1.5px] border-line-strong bg-white p-5 text-[17px] leading-relaxed outline-none focus:border-brand focus:shadow-[0_0_0_4px_rgba(47,107,79,0.14)]"
      />
      <span className="text-xs text-muted">Виділи слово і натисни кнопку зверху. Ctrl+B — жирний, Ctrl+I — курсив, Ctrl+U — підкреслення.</span>
    </div>
  );
}
