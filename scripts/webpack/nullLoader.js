'use strict';

/**
 * @description Used to ignore certain type of files during the compilation from
 * webpack.
 */

module.exports = function (_) {
    this.cacheable && this.cacheable();
    return '';
}