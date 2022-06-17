
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
    
    paragraph: /a/y,
    text: /[^\n]+/y,

};

/**
 * @internal
 */
export const MD_INLINE_RULE = {

    

};