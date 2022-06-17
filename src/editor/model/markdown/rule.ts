
interface ILinkRegExp {
    replace: (name: string, val: string | RegExp) => ILinkRegExp;
    getRegexp: () => RegExp;
}

export function replaceable(regex: string | RegExp, opt?: string): ILinkRegExp {
    let rawRegexp = typeof regex === 'string' ? regex : regex.source;
    opt = opt || '';
    const obj = {
        replace: (name: string, newRule: string | RegExp) => {
            let rawNewRule = typeof newRule === 'string' ? newRule : newRule.source;
            rawNewRule = rawNewRule.replace(/(^|[^\[])\^/g, '$1');
            rawRegexp = rawRegexp.replace(name, rawNewRule);
            return obj;
        },
        getRegexp: () => new RegExp(rawRegexp, opt)
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

    tag: `address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,

};

MD_BLOCK_RULE.paragraph = replaceable(MD_BLOCK_RULE.paragraph, 'y')
  .replace('hr', MD_BLOCK_RULE.hr)
  .replace('heading', ' {0,3}#{1,6} ')
  .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
  .replace('|table', '')
  .replace('blockquote', ' {0,3}>')
  .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
  .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)')
  .replace('tag', MD_BLOCK_RULE.tag) // pars can be interrupted by type (6) html blocks
  .getRegexp();


/**
 * @internal
 */
export const MD_INLINE_RULE = {

    

};