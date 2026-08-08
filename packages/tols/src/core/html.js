/**
 * HTML core — formatter and minifier ported from apps/web HtmlTool.svelte.
 * Same tokenizer, tag-stack indentation, void/whitespace-sensitive element
 * handling, and minify options.
 */

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

  /** @type {Array<any>} */
  const tokens = [];
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      if (html.substring(i, i + 4) === '<!--') {
        const end = html.indexOf('-->', i);
        if (end === -1) {
          tokens.push({ type: 'comment', content: html.substring(i) });
          break;
        }
        tokens.push({ type: 'comment', content: html.substring(i, end + 3) });
        i = end + 3;
      } else if (html.substring(i, i + 9).toLowerCase() === '<!doctype') {
        const end = html.indexOf('>', i);
        if (end === -1) {
          tokens.push({ type: 'doctype', content: html.substring(i) });
          break;
        }
        tokens.push({ type: 'doctype', content: html.substring(i, end + 1) });
        i = end + 1;
      } else if (html.substring(i, i + 2) === '</') {
        const end = html.indexOf('>', i);
        if (end === -1) {
          tokens.push({ type: 'text', content: html.substring(i) });
          break;
        }
        const tagName = html.substring(i + 2, end).trim().split(/\s+/)[0].toLowerCase();
        tokens.push({ type: 'close', name: tagName });
        i = end + 1;
      } else {
        const end = html.indexOf('>', i);
        if (end === -1) {
          tokens.push({ type: 'text', content: html.substring(i) });
          break;
        }
        const tagContent = html.substring(i + 1, end);
        const isSelfClosing = tagContent.endsWith('/') || VOID_ELEMENTS.has(tagContent.split(/\s+/)[0].toLowerCase());
        const actualContent = isSelfClosing && tagContent.endsWith('/') ? tagContent.slice(0, -1).trim() : tagContent.trim();
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
        const isPreserve = PRESERVE_WHITESPACE.has(token.name);
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
        tagStack.push(token.name);
        break;
      }
      case 'close': {
        const isPreserve = PRESERVE_WHITESPACE.has(token.name);
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] === token.name) {
          tagStack.pop();
          if (!isPreserve) {
            indent = Math.max(0, indent - 1);
          }
        } else {
          const stackIndex = tagStack.lastIndexOf(token.name);
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
          formatted += '</' + token.name + '>';
          if (isPreserve) {
            preserveOpen--;
            formatted += '\n';
          }
        } else {
          formatted += tab.repeat(Math.max(0, indent)) + '</' + token.name + '>\n';
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
 * @param {{ removeComments?: boolean, removeWhitespace?: boolean }} opts
 */
export function minify(html, opts = {}) {
  const removeComments = opts.removeComments ?? false;
  const removeWhitespace = opts.removeWhitespace ?? false;

  /** @type {{ placeholder: string, content: string }[]} */
  const protectedBlocks = [];
  let protectedIndex = 0;

  const WHITESPACE_SENSITIVE = /<(pre|code|textarea|script|style)[^>]*>[\s\S]*?<\/\1>/gi;
  let protectedHtml = html.replace(WHITESPACE_SENSITIVE, (match) => {
    const placeholder = `___PROTECTED_${protectedIndex}___`;
    protectedBlocks.push({ placeholder, content: match });
    protectedIndex++;
    return placeholder;
  });

  let minified = protectedHtml
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n/g, ' ');

  if (removeComments) {
    minified = removeHtmlComments(minified);
  }

  if (removeWhitespace) {
    minified = minified
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s*>/g, '>')
      .replace(/<\s*/g, '<');
  }

  // Single-pass restore: a string replacement would interpret $ patterns
  // ($&, $', ...) inside the protected content; a callback keeps it literal.
  minified = minified.replace(/___PROTECTED_(\d+)___/g, (m, idx) => protectedBlocks[Number(idx)]?.content ?? m);

  return minified.trim();
}
