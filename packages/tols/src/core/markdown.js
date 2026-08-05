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
  if (!url || url.startsWith('#') || url.startsWith('/')) {
    return url;
  }
  try {
    const parsed = new URL(url, base);
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // fall through
  }
  return '#';
}

/** @param {string} text */
export function parseInline(text) {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

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

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('```')) {
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
      flushList();
      flushBlockquote();
      result.push('<hr>');
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushList();
      flushBlockquote();
      const level = headerMatch[1].length;
      const content = parseInline(headerMatch[2]);
      result.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
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
      result.push(`<p>${parseInline(line)}</p>`);
    }
  }

  flushList();
  flushBlockquote();

  return result.join('\n');
}
