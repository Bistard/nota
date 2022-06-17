const caret = /(^|[^\[])\^/g;

/**
 * @param {string | RegExp} regex
 * @param {string} opt
 */
export function edit(regex, opt) {
  regex = typeof regex === 'string' ? regex : regex.source;
  opt = opt || '';
  const obj = {
    replace: (name, val) => {
      val = val.source || val;
      val = val.replace(caret, '$1');
      regex = regex.replace(name, val);
      return obj;
    },
    getRegex: () => {
      return new RegExp(regex, opt);
    }
  };
  return obj;
}

/**
 * @internal
 */
export const MD_BLOCK_RULE = {
    space: /(?: *(?:\n|$))+/y,
    indentCode: /( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/y,
    fenceCode: / {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/y,
    heading: / {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/y,
    hr: / {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/y,
    blockQuote: /( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/y,
    list: /( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/y,

    paragraph: /([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/y,
    text: /[^\n]+/y,
};

MD_BLOCK_RULE.paragraph = null!; // REVIEW

/**
 * @internal
 */
export const MD_INLINE_RULE = {

    

};