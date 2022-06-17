
/**
 * @internal
 */
export const MD_BLOCK_RULE = {

    text: /[^\n]+/y,
    space: /(?: *(?:\n|$))+/y,
    heading: / {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/y,
    paragraph: /a/y,

};

/**
 * @internal
 */
export const MD_INLINE_RULE = {

    

};