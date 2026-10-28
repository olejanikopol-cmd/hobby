import { describe, expect, it } from 'vitest';
import { htmlToText, sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('залишає форматування окремих слів', () => {
    const html = '<p>Слово <b>жирне</b>, слово <s>закреслене</s>, <span style="color: #2F6B4F">зелене</span></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('прибирає скрипти і обробники подій', () => {
    expect(sanitizeHtml('<p onclick="alert(1)">ok<script>alert(1)</script></p>')).toBe('<p>ok</p>');
    expect(sanitizeHtml('<img src=x onerror=alert(1)>текст')).toBe('текст');
  });

  it('пропускає лише безпечні посилання', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(sanitizeHtml('<a href="https://instagram.com/x">x</a>')).toBe('<a href="https://instagram.com/x" target="_blank" rel="noopener noreferrer nofollow">x</a>');
  });

  it('вирізає небезпечні стилі', () => {
    expect(sanitizeHtml('<span style="background-image: url(x); color: red">x</span>')).toBe('<span style="color: red">x</span>');
    expect(sanitizeHtml('<span style="position: fixed">x</span>')).toBe('<span>x</span>');
  });

  it('закриває незакриті теги і екранує текст', () => {
    expect(sanitizeHtml('<b>жирний <i>курсив')).toBe('<b>жирний <i>курсив</i></b>');
    expect(sanitizeHtml('a < b & c')).toBe('a &lt; b &amp; c');
  });

  it('htmlToText', () => {
    expect(htmlToText('<h3>Привіт</h3><p>світ</p>')).toBe('Привіт світ');
  });
});
