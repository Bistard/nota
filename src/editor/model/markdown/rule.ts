
interface ILinkRegExp {
    replace: (name: string | RegExp, val: string | RegExp) => ILinkRegExp;
    getRegexp: () => RegExp;
}

export function replaceable(regex: string | RegExp, opt?: string): ILinkRegExp {
    let rawRegexp = typeof regex === 'string' ? regex : regex.source;
    opt = opt || '';
    const obj = {
        replace: (name: string | RegExp, newRule: string | RegExp) => {
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
    list: /( {0,3}bullet)([ \t][^\n]+?)?(?:\n|$)/y,
    def: / {0,3}\[(label)\]: *(?:\n *)?<?([^\s>]+)>?(?:(?: +(?:\n *)?| *\n *)(title))? *(?:\n+|$)/y,
    
    paragraph: /([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/y,
    text: /[^\n]+/y,

    tag: `address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,
    bullet: /(?:[*+-]|\d{1,9}[.)])/y,
    label: /(?!\s*\])(?:\\.|[^\[\]\\])+/y,
    title: /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/y,
    
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

MD_BLOCK_RULE.def = replaceable(MD_BLOCK_RULE.def, 'y')
    .replace('label', MD_BLOCK_RULE.label)
    .replace('title', MD_BLOCK_RULE.title)
    .getRegexp();

MD_BLOCK_RULE.list = replaceable(MD_BLOCK_RULE.list, 'y')
    .replace(/bullet/g, MD_BLOCK_RULE.bullet)
    .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
    .replace('def', '\\n+(?=' + MD_BLOCK_RULE.def.source + ')')
    .getRegexp();
    

/**
 * @internal
 */
export const MD_INLINE_RULE = {

    

};