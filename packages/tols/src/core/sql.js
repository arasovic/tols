/**
 * SQL core — tokenizer, formatter, minifier ported from apps/web SqlTool.svelte.
 * Same keyword list, newline-before clauses, and paren/comma indentation.
 * CLI addition: keywordCase 'preserve' (web only offers upper/lower).
 */

export const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'INSERT', 'UPDATE', 'DELETE',
  'VALUES', 'SET', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS',
  'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
  'DISTINCT', 'AS', 'ASC', 'DESC', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE',
  'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IF', 'CREATE', 'TABLE',
  'ALTER', 'DROP', 'INDEX', 'VIEW', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'DEFAULT', 'AUTO_INCREMENT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
];

export const NEWLINE_BEFORE = ['SELECT', 'FROM', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'UNION'];

/** @param {string} sql */
export function tokenize(sql) {
  const tokens = [];
  let i = 0;
  let line = 1;
  let col = 1;

  while (i < sql.length) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (char === '-' && nextChar === '-') {
      let comment = '--';
      i += 2;
      col += 2;
      while (i < sql.length && sql[i] !== '\n') {
        comment += sql[i];
        i++;
        col++;
      }
      tokens.push({ type: 'COMMENT', value: comment, line, col });
      continue;
    }

    if (char === '/' && nextChar === '*') {
      let comment = '/*';
      i += 2;
      col += 2;
      // Unterminated comments run to EOF; the previous `length - 1` bound
      // orphaned the final character as a separate token.
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) {
        if (sql[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        comment += sql[i];
        i++;
      }
      if (i < sql.length) {
        comment += '*/';
        i += 2;
        col += 2;
      }
      tokens.push({ type: 'COMMENT', value: comment, line, col });
      continue;
    }

    if (char === "'" || char === '"') {
      const quote = char;
      let str = quote;
      i++;
      col++;
      while (i < sql.length && sql[i] !== quote) {
        if (sql[i] === '\\' && i + 1 < sql.length) {
          str += sql[i] + sql[i + 1];
          i += 2;
          col += 2;
        } else {
          if (sql[i] === '\n') {
            line++;
            col = 1;
          } else {
            col++;
          }
          str += sql[i];
          i++;
        }
      }
      if (i < sql.length) {
        str += quote;
        i++;
        col++;
      }
      tokens.push({ type: 'STRING', value: str, line, col });
      continue;
    }

    if (/\s/.test(char)) {
      let ws = '';
      while (i < sql.length && /\s/.test(sql[i])) {
        if (sql[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        ws += sql[i];
        i++;
      }
      tokens.push({ type: 'WHITESPACE', value: ws, line, col });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (i < sql.length && /[a-zA-Z0-9_$]/.test(sql[i])) {
        word += sql[i];
        i++;
        col++;
      }
      tokens.push({ type: 'WORD', value: word, line, col });
      continue;
    }

    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(sql[i + 1] || ''))) {
      let num = '';
      while (i < sql.length && (/[0-9.]/.test(sql[i]) || sql[i].toLowerCase() === 'e' || /[+-]/.test(sql[i]))) {
        num += sql[i];
        i++;
        col++;
      }
      tokens.push({ type: 'NUMBER', value: num, line, col });
      continue;
    }

    if (char === ';') {
      tokens.push({ type: 'SEMICOLON', value: ';', line, col });
      i++;
      col++;
      continue;
    }

    tokens.push({ type: 'SYMBOL', value: char, line, col });
    i++;
    col++;
  }

  return tokens;
}

/**
 * @param {any[]} tokens
 * @param {'uppercase' | 'lowercase' | 'preserve'} keywordCase
 * @param {string} indentation
 */
function formatWithNewlines(tokens, keywordCase, indentation) {
  const result = [];
  let indentLevel = 0;
  let currentLine = '';

  const cased = (word) => {
    const upper = word.toUpperCase();
    if (keywordCase === 'uppercase') return upper;
    if (keywordCase === 'lowercase') return upper.toLowerCase();
    return word;
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'COMMENT') {
      if (currentLine.trim()) {
        result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim());
        currentLine = '';
      }
      result.push(token.value);
      continue;
    }

    if (token.type === 'STRING') {
      currentLine += token.value;
      continue;
    }

    if (token.type === 'WHITESPACE') {
      if (currentLine && !currentLine.endsWith(' ')) {
        currentLine += ' ';
      }
      continue;
    }

    if (token.type === 'SEMICOLON') {
      if (currentLine.trim()) {
        result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim());
      }
      result.push(';');
      currentLine = '';
      indentLevel = 0;
      continue;
    }

    if (token.type === 'WORD') {
      const upperWord = token.value.toUpperCase();

      if (NEWLINE_BEFORE.includes(upperWord)) {
        if (currentLine.trim()) {
          result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim());
        }
        currentLine = cased(token.value);
      } else {
        const replacement = KEYWORDS.includes(upperWord) ? cased(token.value) : token.value;
        currentLine += replacement;
      }
      continue;
    }

    if (token.type === 'SYMBOL') {
      if (token.value === '(') {
        currentLine += token.value;
        indentLevel++;
      } else if (token.value === ')') {
        if (/^\s*\)/.test(currentLine)) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        currentLine += token.value;
        indentLevel = Math.max(0, indentLevel - 1);
      } else if (token.value === ',') {
        currentLine += token.value;
        if (currentLine.trim()) {
          result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim());
        }
        currentLine = indentation;
      } else {
        currentLine += token.value;
      }
      continue;
    }

    currentLine += token.value;
  }

  if (currentLine.trim()) {
    result.push(indentation.repeat(Math.max(0, indentLevel)) + currentLine.trim());
  }

  return result.join('\n');
}

/**
 * @param {string} sql
 * @param {{ keywordCase?: 'uppercase' | 'lowercase' | 'preserve' }} opts
 */
export function format(sql, opts = {}) {
  if (!sql.trim()) return '';
  const keywordCase = opts.keywordCase ?? 'uppercase';
  return formatWithNewlines(tokenize(sql), keywordCase, '  ').trim();
}

/** @param {string} sql */
export function minify(sql) {
  if (!sql.trim()) return '';
  const tokens = tokenize(sql);
  const result = [];
  const strings = [];
  for (const token of tokens) {
    if (token.type === 'COMMENT') continue;
    if (token.type === 'WHITESPACE') {
      if (result.length > 0 && !/\s$/.test(result[result.length - 1])) {
        result.push(' ');
      }
      continue;
    }
    if (token.type === 'STRING') {
      // The web's final whitespace collapse leaked into string literals and
      // changed their content; protect them through the regex passes.
      result.push(`___SQLSTR_${strings.length}___`);
      strings.push(token.value);
      continue;
    }
    result.push(token.value);
  }
  let out = result
    .join('')
    .replace(/\s*([(),])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  // Single-pass restore: string replacement would interpret $ patterns
  // ($&, $', ...) inside string literals; a callback keeps them literal.
  out = out.replace(/___SQLSTR_(\d+)___/g, (m, idx) => strings[Number(idx)] ?? m);
  return out;
}
