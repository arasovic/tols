/**
 * XML core — formatter and minifier ported from apps/web XmlTool.svelte.
 * validate() differs from the web: the web uses DOMParser (browser-only);
 * here validation is structural (tokenizer + tag-stack balance), which is
 * what a zero-dependency CLI can offer.
 */

/** @param {string} str */
export function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Tokenize XML into tags/text/CDATA/comments/PIs, collecting structural
 * problems (unclosed constructs, tag mismatches) along the way.
 * @param {string} xml
 * @returns {{ tokens: Array<any>, mismatches: string[] }}
 */
export function tokenize(xml) {
  const tokens = [];
  const mismatches = [];
  const tagStack = [];
  let i = 0;
  const xmlLength = xml.length;

  while (i < xmlLength) {
    if (xml[i] === '<') {
      if (i + 4 <= xmlLength && xml.substring(i, i + 4) === '<!--') {
        const end = xml.indexOf('-->', i);
        if (end === -1) {
          mismatches.push('Unclosed comment starting at position ' + i);
          break;
        }
        tokens.push({ type: 'comment', content: xml.substring(i, end + 3) });
        i = end + 3;
      } else if (i + 9 <= xmlLength && xml.substring(i, i + 9) === '<![CDATA[') {
        const end = xml.indexOf(']]>', i);
        if (end === -1) {
          mismatches.push('Unclosed CDATA section starting at position ' + i);
          break;
        }
        tokens.push({ type: 'cdata', content: xml.substring(i, end + 3) });
        i = end + 3;
      } else if (i + 2 <= xmlLength && xml.substring(i, i + 2) === '<?') {
        const end = xml.indexOf('?>', i);
        if (end === -1) {
          mismatches.push('Unclosed processing instruction starting at position ' + i);
          break;
        }
        tokens.push({ type: 'pi', content: xml.substring(i, end + 2) });
        i = end + 2;
      } else if (i + 9 <= xmlLength && xml.substring(i, i + 9).toUpperCase() === '<!DOCTYPE') {
        const end = xml.indexOf('>', i);
        if (end === -1) {
          mismatches.push('Unclosed DOCTYPE declaration starting at position ' + i);
          break;
        }
        tokens.push({ type: 'doctype', content: xml.substring(i, end + 1) });
        i = end + 1;
      } else if (i + 2 <= xmlLength && xml.substring(i, i + 2) === '</') {
        const end = xml.indexOf('>', i);
        if (end === -1) {
          mismatches.push('Unclosed end tag starting at position ' + i);
          break;
        }
        const tagName = xml.substring(i + 2, end).trim().split(/\s+/)[0];
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] !== tagName) {
          mismatches.push(`Tag mismatch: expected </${tagStack[tagStack.length - 1]}> but found </${tagName}>`);
        } else if (tagStack.length > 0) {
          tagStack.pop();
        }
        tokens.push({ type: 'close', name: tagName });
        i = end + 1;
      } else {
        const end = xml.indexOf('>', i);
        if (end === -1) {
          mismatches.push('Unclosed tag starting at position ' + i);
          break;
        }
        const tagContent = xml.substring(i + 1, end);
        const isSelfClosing = tagContent.endsWith('/');
        const actualContent = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent.trim();
        const tagName = actualContent.split(/\s+/)[0];
        const attrs = actualContent.substring(tagName.length).trim();

        tokens.push({
          type: isSelfClosing ? 'self-closing' : 'open',
          name: tagName,
          attrs: attrs,
          full: xml.substring(i, end + 1),
        });
        if (!isSelfClosing) tagStack.push(tagName);
        i = end + 1;
      }
    } else if (i < xmlLength && !xml.substring(i).trim()) {
      break;
    } else {
      const nextTag = xml.indexOf('<', i);
      let text;
      if (nextTag === -1) {
        text = xml.substring(i);
        i = xmlLength;
      } else {
        text = xml.substring(i, nextTag);
        i = nextTag;
      }
      if (text.trim()) {
        tokens.push({ type: 'text', content: text.trim() });
      }
    }
  }

  if (tagStack.length > 0) {
    mismatches.push(`Unclosed tags: ${tagStack.join(', ')}`);
  }
  return { tokens, mismatches };
}

/**
 * Format XML with 2-space indentation. Throws on structural errors,
 * matching the web tool's error surface.
 * @param {string} xml
 */
export function format(xml) {
  let formatted = '';
  let indent = 0;
  const tab = '  ';
  const tagStack = [];

  const { tokens, mismatches } = tokenize(xml);

  for (let j = 0; j < tokens.length; j++) {
    const token = tokens[j];
    switch (token.type) {
      case 'pi':
      case 'comment':
      case 'cdata':
      case 'doctype':
        formatted += tab.repeat(indent) + token.content + '\n';
        break;
      case 'open':
        formatted += tab.repeat(indent) + token.full + '\n';
        tagStack.push(token.name);
        indent++;
        break;
      case 'close':
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] === token.name) {
          tagStack.pop();
          indent = Math.max(0, indent - 1);
        }
        formatted += tab.repeat(indent) + '</' + token.name + '>\n';
        break;
      case 'self-closing':
        formatted += tab.repeat(indent) + token.full + '\n';
        break;
      case 'text':
        formatted += tab.repeat(indent) + token.content + '\n';
        break;
    }
  }

  if (mismatches.length > 0) {
    throw new Error('XML structure error: ' + mismatches.join('; '));
  }

  return formatted.trim() || xml;
}

/**
 * Minify markup by dropping whitespace-only runs between tags. Whitespace
 * inside text nodes and attribute values is left untouched (the previous
 * blanket collapse rewrote attribute values and significant text).
 * @param {string} xml
 */
export function minify(xml) {
  return xml.replace(/>[\t\n\r ]+</g, '><').trim();
}

/**
 * Structural validation. Returns null when balanced, else the first
 * problem found. (Web uses DOMParser; see module header.)
 * @param {string} xml
 * @returns {string | null}
 */
export function validate(xml) {
  const { mismatches } = tokenize(xml);
  return mismatches.length > 0 ? mismatches.join('; ') : null;
}
