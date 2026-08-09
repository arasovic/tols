/**
 * HTML core — formatter and minifier ported from apps/web HtmlTool.svelte.
 * Same tokenizer, tag-stack indentation, void/whitespace-sensitive element
 * handling, and minify options.
 */

import { findTagEnd, findDoctypeEnd } from '../internal/markup-boundaries.js';

export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

export const PRESERVE_WHITESPACE = new Set(['pre', 'code', 'textarea', 'script', 'style']);

/** @param {string} str */
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** @param {string} html */
export function format(html) {
  let formatted = '';
  let indent = 0;
  const tab = '  ';
  const tokens = tokenizeHtml(html);

  const tagStack = [];
  // Count of currently open whitespace-sensitive elements; while > 0 every
  // token is emitted raw so <pre>/<textarea>/... content is untouched.
  let preserveOpen = 0;
  for (let j = 0; j < tokens.length; j++) {
    const token = tokens[j];

    switch (token.type) {
      case 'doctype':
        formatted += token.content + (preserveOpen > 0 ? '' : '\n');
        break;
      case 'comment':
        formatted += (preserveOpen > 0 ? '' : tab.repeat(indent)) + token.content + (preserveOpen > 0 ? '' : '\n');
        break;
      case 'open': {
        const tokenName = token.name ?? '';
        const isPreserve = PRESERVE_WHITESPACE.has(tokenName);
        if (preserveOpen > 0) {
          formatted += token.content;
        } else if (isPreserve) {
          // Significant-whitespace element: no trailing newline, so the
          // content starts exactly as written.
          formatted += tab.repeat(indent) + token.content;
        } else {
          formatted += tab.repeat(indent) + token.content + '\n';
          indent++;
        }
        if (isPreserve) preserveOpen++;
        tagStack.push(tokenName);
        break;
      }
      case 'close': {
        const tokenName = token.name ?? '';
        const isPreserve = PRESERVE_WHITESPACE.has(tokenName);
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tokenName) {
          tagStack.pop();
          if (!isPreserve) {
            indent = Math.max(0, indent - 1);
          }
        } else {
          const stackIndex = tagStack.lastIndexOf(tokenName);
          if (stackIndex !== -1) {
            for (let k = stackIndex; k < tagStack.length; k++) {
              if (!PRESERVE_WHITESPACE.has(tagStack[k])) {
                indent = Math.max(0, indent - 1);
              }
            }
            tagStack.splice(stackIndex);
          }
        }
        if (preserveOpen > 0) {
          formatted += '</' + tokenName + '>';
          if (isPreserve) {
            preserveOpen--;
            formatted += '\n';
          }
        } else {
          formatted += tab.repeat(Math.max(0, indent)) + '</' + tokenName + '>\n';
        }
        break;
      }
      case 'self-closing':
        formatted += (preserveOpen > 0 ? '' : tab.repeat(indent)) + token.content + (preserveOpen > 0 ? '' : '\n');
        break;
      case 'text': {
        if (preserveOpen > 0) {
          formatted += token.content;
          break;
        }
        const trimmed = token.content.trim();
        if (trimmed) {
          formatted += tab.repeat(indent) + trimmed + '\n';
        }
        break;
      }
    }
  }

  return formatted.trim() || escapeHtml(html);
}

/**
 * Remove complete HTML comments without joining the surrounding fragments
 * into a new comment opener. Unclosed comments are preserved.
 * @param {string} value
 */
function removeHtmlComments(value) {
  let result = '';
  let cursor = 0;

  /** @param {string} part */
  const append = (part) => {
    if ((result.slice(-3) + part.slice(0, 3)).includes('<!--')) {
      result += ' ';
    }
    result += part;
  };

  while (cursor < value.length) {
    const start = value.indexOf('<!--', cursor);
    if (start === -1) {
      append(value.slice(cursor));
      break;
    }

    append(value.slice(cursor, start));
    const end = value.indexOf('-->', start + 4);
    if (end === -1) {
      result += value.slice(start);
      break;
    }
    cursor = end + 3;
  }

  return result;
}

/**
 * @param {string} html
 * @returns {Array<{ type: string, name?: string, content: string }>}
 */
function tokenizeHtml(html) {
  /** @type {Array<{ type: string, name?: string, content: string }>} */
  const tokens = [];
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      if (html.substring(i, i + 4) === '<!--') {
        const end = html.indexOf('-->', i);
        if (end === -1) {
          tokens.push({ type: 'text', content: html.substring(i) });
          break;
        }
        tokens.push({ type: 'comment', content: html.substring(i, end + 3) });
        i = end + 3;
      } else if (html.substring(i, i + 9).toLowerCase() === '<!doctype') {
        const end = findDoctypeEnd(html, i);
        if (end === -1) {
          tokens.push({ type: 'text', content: html.substring(i) });
          break;
        }
        tokens.push({ type: 'doctype', content: html.substring(i, end + 1) });
        i = end + 1;
      } else if (html.substring(i, i + 2) === '</') {
        const end = findTagEnd(html, i);
        if (end === -1) {
          tokens.push({ type: 'text', content: html.substring(i) });
          break;
        }
        const tagName = html.substring(i + 2, end).trim().split(/\s+/)[0].toLowerCase();
        tokens.push({
          type: 'close',
          name: tagName,
          content: html.substring(i, end + 1),
        });
        i = end + 1;
      } else {
        const end = findTagEnd(html, i);
        if (end === -1) {
          tokens.push({ type: 'text', content: html.substring(i) });
          break;
        }
        const tagContent = html.substring(i + 1, end);
        const isSelfClosing = tagContent.endsWith('/') || VOID_ELEMENTS.has(tagContent.split(/\s+/)[0].toLowerCase());
        const actualContent = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent.trim();
        const tagName = actualContent.split(/\s+/)[0].toLowerCase();

        tokens.push({
          type: isSelfClosing ? 'self-closing' : 'open',
          name: tagName,
          content: html.substring(i, end + 1),
        });
        i = end + 1;
      }
    } else {
      const nextTag = html.indexOf('<', i);
      let text;
      if (nextTag === -1) {
        text = html.substring(i);
        i = html.length;
      } else {
        text = html.substring(i, nextTag);
        i = nextTag;
      }
      if (text) {
        tokens.push({ type: 'text', content: text });
      }
    }
  }

  return tokens;
}

/** @param {string} value */
function normalizeTagSpacing(value) {
  let quote = '';
  let inWhitespace = false;
  let output = '';

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      output += char;
      if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === '\'') {
      quote = char;
      output += char;
      inWhitespace = false;
      continue;
    }

    if (/\s/.test(char)) {
      if (!inWhitespace) {
        output += ' ';
        inWhitespace = true;
      }
      continue;
    }

    inWhitespace = false;
    output += char;
  }

  return output;
}

/** @param {string} value
 *  @returns {string} */
function normalizeTagWhitespace(value) {
  let quote = '';
  let output = '';
  let afterOpenBracket = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (quote) {
      output += char;
      if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      output += char;
      continue;
    }

    if (char === '<') {
      output += char;
      afterOpenBracket = true;
      continue;
    }

    if (afterOpenBracket && /\s/.test(char)) {
      continue;
    }

    afterOpenBracket = false;

    if (char === '>') {
      let end = output.length;
      while (end > 0 && output[end - 1] === ' ') {
        end--;
      }
      output = output.slice(0, end);
      output += '>';
      continue;
    }

    output += char;
  }

  return output;
}

/** @param {string} value */
function normalizeText(value) {
  return value.replace(/\s+/g, ' ');
}

/**
 * @param {string} html
 * @param {{ removeComments?: boolean, removeWhitespace?: boolean }} opts
 */
export function minify(html, opts = {}) {
  const removeComments = opts.removeComments ?? false;
  const removeWhitespace = opts.removeWhitespace ?? false;
  const tokens = tokenizeHtml(html);

  let minified = '';
  let preserveOpen = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'text') {
      if (preserveOpen > 0) {
        minified += token.content;
      } else {
        const trimmed = normalizeText(token.content);
        if (!trimmed.trim()) {
          continue;
        }
        minified += trimmed;
      }
      continue;
    }

    if (token.type === 'comment') {
      if (!removeComments || preserveOpen > 0) {
        minified += token.content;
      }
      continue;
    }

    if (token.type === 'open' && PRESERVE_WHITESPACE.has(token.name ?? '')) {
      preserveOpen += 1;
      minified += token.content;
      continue;
    }

    if (token.type === 'close' && PRESERVE_WHITESPACE.has(token.name ?? '') && preserveOpen > 0) {
      preserveOpen -= 1;
      minified += token.content;
      continue;
    }

    if (preserveOpen > 0) {
      minified += token.content;
      continue;
    }

    if (token.type === 'doctype') {
      minified += token.content;
      continue;
    }

    let normalizedToken = token.content;
    if (token.type !== 'self-closing' && token.type !== 'open' && token.type !== 'close') {
      continue;
    }

    if (removeWhitespace) {
      normalizedToken = normalizeTagWhitespace(normalizedToken);
    } else {
      normalizedToken = normalizeTagSpacing(normalizedToken);
    }

    minified += normalizedToken;
  }

  if (removeComments) {
    minified = removeHtmlComments(minified);
  }

  return minified.trim();
}
