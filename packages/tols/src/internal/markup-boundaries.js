/** @param {string} source
 *  @param {number} start */
export function findTagEnd(source, start) {
  let quote = '';
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '>') {
      return i;
    }
  }

  return -1;
}

/** @param {string} source
 *  @param {number} start */
export function findDoctypeEnd(source, start) {
  let quote = '';
  let inInternalSubset = false;

  for (let i = start; i < source.length; i++) {
    const char = source[i];

    if (quote) {
      if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (inInternalSubset) {
      if (char === ']' ) {
        inInternalSubset = false;
        continue;
      }

      if (char === '<' && source.substring(i, i + 2) === '<?') {
        const piEnd = source.indexOf('?>', i + 2);
        if (piEnd === -1) {
          return -1;
        }
        i = piEnd;
        continue;
      }

      if (source.substring(i, i + 4) === '<!--') {
        const commentEnd = source.indexOf('-->', i + 4);
        if (commentEnd === -1) {
          return -1;
        }
        i = commentEnd + 2;
        continue;
      }

      continue;
    }

    if (char === '[') {
      inInternalSubset = true;
      continue;
    }

    if (char === '>') {
      return i;
    }
  }

  return -1;
}
