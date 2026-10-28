/**
 * Очищення HTML з редактора ведучого. Дозволяємо лише форматування тексту —
 * жодних скриптів, обробників подій, iframe чи зовнішніх стилів.
 * Працює і на сервері, і в браузері (без DOM): простий токенізатор тегів.
 */
const ALLOWED = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'span', 'font', 'a', 'h3', 'ul', 'ol', 'li', 'div', 'mark']);
const STYLE_PROPS = new Set(['color', 'background-color', 'font-family', 'font-weight', 'font-style', 'font-size', 'text-decoration', 'text-decoration-line']);
const VOID = new Set(['br']);

function escapeText(s: string): string {
  return s.replace(/&(?!(#\d+|#x[0-9a-f]+|[a-z]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cleanStyle(style: string): string {
  const out: string[] = [];
  for (const decl of style.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim().toLowerCase();
    const value = decl.slice(i + 1).trim();
    if (!STYLE_PROPS.has(prop)) continue;
    if (/url\s*\(|expression|javascript:|[<>{}]/i.test(value)) continue;
    if (value.length > 80) continue;
    out.push(`${prop}: ${value}`);
  }
  return out.join('; ');
}

function cleanHref(href: string): string | null {
  const v = href.trim();
  if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v)) return v;
  return null;
}

function parseAttrs(src: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? '';
  }
  return attrs;
}

export function sanitizeHtml(html: string): string {
  let out = '';
  const stack: string[] = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)|</g;
  let skipUntil: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [token, closing, rawTag, rawAttrs, text] = m;
    if (token.startsWith('<!--')) continue;
    const tag = rawTag?.toLowerCase();
    if (skipUntil) {
      if (closing && tag === skipUntil) skipUntil = null;
      continue;
    }
    if (text !== undefined) {
      out += escapeText(text);
      continue;
    }
    if (!tag) {
      out += '&lt;';
      continue;
    }
    if (['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'svg', 'math'].includes(tag)) {
      if (!closing && !/\/\s*$/.test(rawAttrs)) skipUntil = tag;
      continue;
    }
    if (!ALLOWED.has(tag)) continue;
    if (closing) {
      const idx = stack.lastIndexOf(tag);
      if (idx === -1) continue;
      while (stack.length > idx) out += `</${stack.pop()}>`;
      continue;
    }
    const attrs = parseAttrs(rawAttrs);
    let attrOut = '';
    if (attrs.style) {
      const st = cleanStyle(attrs.style);
      if (st) attrOut += ` style="${escapeAttr(st)}"`;
    }
    if (tag === 'font') {
      if (attrs.face && /^[\w\s,'-]{1,60}$/.test(attrs.face)) attrOut += ` face="${escapeAttr(attrs.face)}"`;
      if (attrs.color && /^#?[0-9a-z]{3,20}$/i.test(attrs.color)) attrOut += ` color="${escapeAttr(attrs.color)}"`;
    }
    if (tag === 'a') {
      const href = attrs.href ? cleanHref(attrs.href) : null;
      if (href) attrOut += ` href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer nofollow"`;
    }
    out += `<${tag}${attrOut}>`;
    if (!VOID.has(tag)) stack.push(tag);
  }
  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}

export function htmlToText(html: string): string {
  return sanitizeHtml(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
