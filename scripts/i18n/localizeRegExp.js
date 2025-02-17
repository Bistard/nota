const { SmartRegExp } = require('../utility');


const LOCALIZE_REGEX = 
    new SmartRegExp(/localize\(quote(str)quote,\s*quote(str)quote[\),]/g)
    .replace('str', /.*?/)
    .replace('quote', /["'`]/)
    .get();

module.exports = { LOCALIZE_REGEX };