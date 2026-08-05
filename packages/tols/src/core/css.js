/**
 * CSS core — tokenizer, formatter, and minifier ported verbatim from
 * apps/web CssTool.svelte (hand-rolled, no dependencies).
 */

/** @param {string} css */
export function tokenizeCSS(css) {
  const tokens = [];
  let i = 0;
  const length = css.length;

  while (i < length) {
    const char = css[i];

    if (char === '/' && css[i + 1] === '*') {
      let comment = '/*';
      i += 2;
      // Unterminated comments run to EOF; the previous `length - 1` bound
      // orphaned the final character as a separate token.
      while (i < length && !(css[i] === '*' && css[i + 1] === '/')) {
        comment += css[i++];
      }
      if (i < length) {
        comment += '*/';
        i += 2;
      }
      tokens.push({ type: 'comment', value: comment });
    } else if (char === '"' || char === "'") {
      const quote = char;
      let string = quote;
      i++;
      while (i < length && css[i] !== quote) {
        if (css[i] === '\\' && i + 1 < length) {
          string += css[i++];
        }
        string += css[i++];
      }
      if (i < length) {
        string += quote;
        i++;
      }
      tokens.push({ type: 'string', value: string });
    } else if (char === '(') {
      let parenCount = 1;
      let content = '(';
      i++;
      while (i < length && parenCount > 0) {
        if (css[i] === '(') {
          parenCount++;
          content += css[i++];
        } else if (css[i] === ')') {
          parenCount--;
          content += css[i++];
        } else if (css[i] === '"' || css[i] === "'") {
          const quote = css[i];
          content += quote;
          i++;
          while (i < length && css[i] !== quote) {
            if (css[i] === '\\' && i + 1 < length) {
              content += css[i++];
            }
            content += css[i++];
          }
          if (i < length) {
            content += quote;
            i++;
          }
        } else {
          content += css[i++];
        }
      }
      tokens.push({ type: 'paren', value: content });
    } else if ('{};:'.includes(char)) {
      tokens.push({ type: 'punctuation', value: char });
      i++;
    } else if (char === '@') {
      let atRule = '@';
      i++;
      // Quote-aware scan: a ';' inside a string (e.g. @import "a;b.css")
      // does not terminate the at-rule.
      while (i < length && /[^{;]/.test(css[i])) {
        if (css[i] === '"' || css[i] === "'") {
          const quote = css[i];
          atRule += css[i++];
          while (i < length && css[i] !== quote) {
            if (css[i] === '\\' && i + 1 < length) {
              atRule += css[i++];
            }
            atRule += css[i++];
          }
          if (i < length) {
            atRule += css[i++];
          }
        } else {
          atRule += css[i++];
        }
      }
      tokens.push({ type: 'atrule', value: atRule.trim() });
    } else if (/\s/.test(char)) {
      let whitespace = '';
      while (i < length && /\s/.test(css[i])) {
        whitespace += css[i++];
      }
      tokens.push({ type: 'whitespace', value: whitespace });
    } else {
      let text = '';
      while (i < length && !/[\s{};:"'()]/.test(css[i])) {
        text += css[i++];
      }
      tokens.push({ type: 'text', value: text });
    }
  }

  return tokens;
}

/**
 * @param {string} atRule
 * @returns {'rules' | 'declarations'}
 */
export function atRuleBlockKind(atRule) {
  const name = atRule.split(/[\s(]/)[0];
  const ruleContainers = ['@media', '@supports', '@container', '@layer', '@document', '@keyframes'];
  return ruleContainers.includes(name) ? 'rules' : 'declarations';
}

/** @param {string} css */
export function format(css) {
  const tokens = tokenizeCSS(css);
  let result = '';
  let indentLevel = 0;
  const indent = '  ';
  let blockDepth = 0;
  let lastTokenWasNewline = false;
  let selectorBuffer = [];
  let needsIndent = true;
  /** @type {Array<'declarations' | 'rules'>} */
  const blockStack = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

    if (token.type === 'comment') {
      if (result && !lastTokenWasNewline) {
        result += '\n';
      }
      result += indent.repeat(indentLevel) + token.value + '\n';
      lastTokenWasNewline = true;
      continue;
    }

    if (token.type === 'whitespace') {
      if (blockDepth > 0 && prevToken && prevToken.type === 'punctuation' && prevToken.value === ';') {
        result += '\n';
        lastTokenWasNewline = true;
        needsIndent = true;
      } else if (
        blockDepth > 0 &&
        blockStack[blockStack.length - 1] === 'declarations' &&
        prevToken &&
        (prevToken.type === 'text' || prevToken.type === 'paren' || prevToken.type === 'string') &&
        nextToken &&
        (nextToken.type === 'text' || nextToken.type === 'paren' || nextToken.type === 'string')
      ) {
        result += ' ';
        lastTokenWasNewline = false;
      } else if (blockDepth === 0 && selectorBuffer.length > 0) {
        result += ' ';
      }
      continue;
    }

    if (token.type === 'punctuation') {
      if (token.value === '{') {
        blockDepth++;
        /** @type {'declarations' | 'rules'} */
        let blockKind = 'declarations';
        for (let j = i - 1; j >= 0; j--) {
          const prev = tokens[j];
          if (prev.type === 'whitespace' || prev.type === 'comment') continue;
          if (prev.type === 'atrule') blockKind = atRuleBlockKind(prev.value);
          break;
        }
        blockStack.push(blockKind);
        result = result.trimEnd();
        result += ' ' + token.value + '\n';
        selectorBuffer = [];
        indentLevel++;
        lastTokenWasNewline = true;
        needsIndent = true;
      } else if (token.value === '}') {
        if (blockDepth > 0) blockDepth--;
        if (blockStack.length > 0) blockStack.pop();
        indentLevel = Math.max(0, indentLevel - 1);
        if (!lastTokenWasNewline) {
          result += '\n';
        }
        result += indent.repeat(indentLevel) + token.value + '\n';
        lastTokenWasNewline = true;
        needsIndent = true;

        if (nextToken && nextToken.type !== 'whitespace' && nextToken.value !== '}') {
          result += '\n';
        }
      } else if (token.value === ';') {
        result += token.value;
        if (nextToken && nextToken.type !== 'punctuation' && nextToken.value !== '}') {
          result += '\n';
          lastTokenWasNewline = true;
          needsIndent = true;
        }
      } else if (token.value === ':') {
        const inDeclarationBlock = blockStack.length > 0 && blockStack[blockStack.length - 1] === 'declarations';
        result += inDeclarationBlock ? ': ' : ':';
      }
      continue;
    }

    if (token.type === 'text' || token.type === 'paren' || token.type === 'string') {
      if (prevToken && prevToken.type === 'atrule') {
        if (!lastTokenWasNewline) {
          result += '\n';
          lastTokenWasNewline = true;
        }
        result += indent.repeat(indentLevel) + prevToken.value + ' ' + token.value;
        selectorBuffer = [];
      } else if (blockDepth > 0) {
        if (needsIndent || lastTokenWasNewline) {
          result += indent.repeat(indentLevel);
          needsIndent = false;
        }
        result += token.value;
        lastTokenWasNewline = false;
      } else {
        if (selectorBuffer.length === 0 && !lastTokenWasNewline && result.length > 0) {
          result += '\n';
          lastTokenWasNewline = true;
        }
        if (result.trimEnd().endsWith(',')) {
          result = result.trimEnd() + '\n' + indent.repeat(indentLevel);
        } else if (result.endsWith(' ')) {
          // continuation of the same selector
        } else if (lastTokenWasNewline || needsIndent) {
          result += indent.repeat(indentLevel);
          needsIndent = false;
        }
        result += token.value;
        selectorBuffer.push(token.value);
        lastTokenWasNewline = false;
      }
      continue;
    }

    if (token.type === 'atrule') {
      if (!lastTokenWasNewline && result.length > 0) {
        result += '\n';
      }
      result += indent.repeat(indentLevel) + token.value;
      lastTokenWasNewline = false;
      selectorBuffer = [];
    }
  }

  return result.trim();
}

/** @param {string} css */
export function minify(css) {
  const tokens = tokenizeCSS(css);
  let result = '';
  let blockDepth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = i > 0 ? tokens[i - 1] : null;
    const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

    if (token.type === 'comment') {
      continue;
    }

    if (token.type === 'whitespace') {
      if (!result) continue;
      const prevVal = prevToken?.value || '';
      const nextVal = nextToken?.value || '';
      if (prevToken && (prevVal === '{' || prevVal === ';' || prevVal === ',' || prevVal === ':')) {
        continue;
      }
      if (nextToken && (nextVal === '}' || nextVal === '{' || nextVal === ';' || nextVal === ',' || nextVal === ':')) {
        continue;
      }
      if (prevToken?.type === 'whitespace') continue;
      result += ' ';
      continue;
    }

    if (token.type === 'punctuation') {
      if (token.value === '{') {
        blockDepth++;
        result = result.trimEnd();
        result += token.value;
      } else if (token.value === '}') {
        if (blockDepth > 0) blockDepth--;
        // The web sliced unconditionally here, eating the last value char
        // when `;}` were adjacent (the `;` handler already skipped it).
        if (prevToken?.value === ';' && result.endsWith(';')) {
          result = result.slice(0, -1);
        }
        result += token.value;
      } else if (token.value === ';') {
        if (nextToken?.value !== '}') {
          result += token.value;
        }
      } else if (token.value === ':') {
        result = result.trimEnd();
        result += ':';
      } else if (token.value === ',') {
        result = result.trimEnd();
        result += ',';
      }
      continue;
    }

    if (token.type === 'text' || token.type === 'paren' || token.type === 'string' || token.type === 'atrule') {
      if (token.type === 'atrule' && result) {
        result += ' ';
      }
      result += token.value;
    }
  }

  return result.trim();
}
