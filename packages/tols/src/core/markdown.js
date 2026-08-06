/**
 * Markdown core — hand-rolled md->HTML ported from apps/web MarkdownTool.svelte.
 * One portability change: the web resolves relative URLs against
 * window.location.href; here the base is a parameter defaulting to a
 * neutral http://localhost so behavior is deterministic in the CLI.
 */

export const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/** @param {string} text */
export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Return the URL when safe (allowed protocol), else '#'.
 * @param {string} url
 * @param {string} [base]
 */
export function sanitizeUrl(url, base = 'http://localhost') {
  if (!url || url.startsWith('#')) {
    return url;
  }
  try {
    const parsed = new URL(url, base);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return '#';
    }
    // A relative reference (no scheme in the raw string) must stay on the
    // base origin: protocol-relative forms like '//host', '/\host' or
    // '\\host' parse cross-origin in browsers even without a scheme.
    const hasOwnScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
    if (!hasOwnScheme && parsed.origin !== new URL(base).origin) {
      return '#';
    }
    return url;
  } catch {
    // fall through
  }
  return '#';
}

/** @param {string} text */
export function parseInline(text) {
  let html = escapeHtml(text).replace(/\u0000/g, '');

  // Code spans are literal: extract them first so emphasis/link rules never
  // reach inside (CommonMark behavior).
  /** @type {string[]} */
  const codeSpans = [];
  html = html.replace(/`([^`]+)`/g, (_match, code) => {
    codeSpans.push(`<code>${code}</code>`);
    return `\u0000C${codeSpans.length - 1}\u0000`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    const safeSrc = sanitizeUrl(src);
    return `<img src="${safeSrc}" alt="${alt}">`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    const safeUrl = sanitizeUrl(url);
    return `<a href="${safeUrl}">${label}</a>`;
  });

  html = html.replace(/  $/gm, '<br>');

  html = html.replace(/\u0000C(\d+)\u0000/g, (_match, idx) => codeSpans[Number(idx)] ?? _match);

  return html;
}

/** @param {string} md */
export function toHtml(md) {
  let html = md;
  const lines = html.split('\n');
  const result = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent = [];
  let inList = false;
  let listItems = [];
  let listType = '';
  let inBlockquote = false;
  let blockquoteLines = [];
  /** @type {string[]} */
  let paragraphLines = [];

  const flushList = () => {
    if (inList) {
      result.push(`<${listType}>${listItems.join('')}</${listType}>`);
      inList = false;
      listItems = [];
      listType = '';
    }
  };
  const flushBlockquote = () => {
    if (inBlockquote) {
      result.push(`<blockquote>${parseInline(blockquoteLines.join('\n'))}</blockquote>`);
      inBlockquote = false;
      blockquoteLines = [];
    }
  };
  /**
   * Consecutive non-blank lines are one paragraph, joined by the newline that
   * separated them. Emitting a <p> per line, which is what this did before,
   * breaks every document whose prose is wrapped at a column: each wrapped line
   * became its own paragraph.
   *
   * Joining also feeds parseInline the whole paragraph at once, which is what
   * its `  $` -> <br> rule (multiline flag) and its emphasis rules were written
   * for. flushBlockquote already did this; the paragraph branch was the one
   * place that did not.
   */
  const flushParagraph = () => {
    if (paragraphLines.length) {
      result.push(`<p>${parseInline(paragraphLines.join('\n'))}</p>`);
      paragraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('```')) {
      flushParagraph();
      if (inCodeBlock) {
        result.push(`<pre><code${codeBlockLang ? ` class="language-${escapeHtml(codeBlockLang)}"` : ''}>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
        inCodeBlock = false;
        codeBlockLang = '';
        codeBlockContent = [];
      } else {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (/^(---|___|\*\*\*)$/.test(line.trim())) {
      flushParagraph();
      flushList();
      flushBlockquote();
      result.push('<hr>');
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const level = headerMatch[1].length;
      const content = parseInline(headerMatch[2]);
      result.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      inBlockquote = true;
      blockquoteLines.push(quoteMatch[1]);
      continue;
    } else {
      flushBlockquote();
    }

    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);

    if (ulMatch || olMatch) {
      flushParagraph();
      const lineMatch = /** @type {RegExpMatchArray} */ (ulMatch || olMatch);
      const isOrdered = !!olMatch;
      const newListType = isOrdered ? 'ol' : 'ul';
      const content = parseInline(lineMatch[2]);

      if (!inList || listType !== newListType) {
        flushList();
        inList = true;
        listType = newListType;
        listItems = [];
      }
      listItems.push(`<li>${content}</li>`);
      continue;
    } else if (inList && line.trim() === '') {
      const nextLine = lines[i + 1];
      const nextUlMatch = nextLine && nextLine.match(/^(\s*)[-*+]\s+(.+)$/);
      const nextOlMatch = nextLine && nextLine.match(/^(\s*)\d+\.\s+(.+)$/);

      if (!nextUlMatch && !nextOlMatch) {
        flushList();
      } else {
        const nextIsOrdered = !!nextOlMatch;
        const nextListType = nextIsOrdered ? 'ol' : 'ul';
        if (listType !== nextListType) {
          flushList();
        }
      }
      continue;
    } else if (inList) {
      flushList();
    }

    if (line.startsWith('    ')) {
      flushParagraph();
      const codeLines = [];
      while (i < lines.length) {
        const currentLine = lines[i];
        if (currentLine.startsWith('    ')) {
          codeLines.push(currentLine.slice(4));
          i++;
        } else if (currentLine.trim() === '') {
          codeLines.push('');
          i++;
        } else {
          break;
        }
      }
      i--;
      result.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    if (line.trim()) {
      paragraphLines.push(line);
    } else {
      flushParagraph();
    }
  }

  flushParagraph();
  flushList();
  flushBlockquote();
  if (inCodeBlock) {
    result.push(`<pre><code${codeBlockLang ? ` class="language-${escapeHtml(codeBlockLang)}"` : ''}>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
  }

  return result.join('\n');
}
