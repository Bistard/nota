"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var _a;
exports.__esModule = true;
exports.URI = void 0;
var charCode_1 = require("src/base/common/charCode");
var os_1 = require("src/base/node/os");
var _empty = '';
var _slash = '/';
var _regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
var URI = /** @class */ (function () {
    /** @internal */
    function URI(scheme, authority, path, query, fragment) {
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query;
        this.fragment = fragment;
    }
    /**
     * Creates a new URI from a string, e.g. `http://www.msft.com/some/path`,
     * `file:///usr/home`, or `scheme:with/path`.
     *
     * @param value A string which represents an URI (see `URI#toString`).
     */
    URI.parse = function (value) {
        var match = _regexp.exec(value);
        if (!match) {
            return new URI(_empty, _empty, _empty, _empty, _empty);
        }
        return new URI(match[2] || _empty, percentDecode(match[4] || _empty), percentDecode(match[5] || _empty), percentDecode(match[7] || _empty), percentDecode(match[9] || _empty));
    };
    URI.isUri = function (thing) {
        if (thing instanceof URI) {
            return true;
        }
        if (!thing) {
            return false;
        }
        return typeof thing.authority === 'string'
            && typeof thing.fragment === 'string'
            && typeof thing.path === 'string'
            && typeof thing.query === 'string'
            && typeof thing.scheme === 'string'
            && typeof thing.toString === 'function';
    };
    /** @description Compute `fsPath` for the given uri. */
    URI.toFsPath = function (uri, keepDriveLetterCasing) {
        if (keepDriveLetterCasing === void 0) { keepDriveLetterCasing = true; }
        var value;
        if (uri.authority && uri.path.length > 1 && uri.scheme === 'file') {
            // unc path: file://shares/c$/far/boo
            value = "" + uri.authority + uri.path;
        }
        else if (uri.path.charCodeAt(0) === charCode_1.CharCode.Slash
            && (uri.path.charCodeAt(1) >= charCode_1.CharCode.A && uri.path.charCodeAt(1) <= charCode_1.CharCode.Z || uri.path.charCodeAt(1) >= charCode_1.CharCode.a && uri.path.charCodeAt(1) <= charCode_1.CharCode.z)
            && uri.path.charCodeAt(2) === charCode_1.CharCode.Colon) {
            if (!keepDriveLetterCasing) {
                // windows drive letter: file:///c:/far/boo
                value = uri.path[1].toLowerCase() + uri.path.substr(2);
            }
            else {
                value = uri.path.substr(1);
            }
        }
        else {
            // other path
            value = uri.path;
        }
        if (os_1.IS_WINDOWS) {
            value = value.replace(/\//g, '\\');
        }
        return value;
    };
    /**
     * Creates a new URI from a file system path, e.g. `c:\my\files`,
     * `/usr/home`, or `\\server\share\some\path`.
     *
     * The *difference* between `URI#parse` and `URI#file` is that the latter treats the argument
     * as path, not as stringified-uri. E.g. `URI.file(path)` is **not the same as**
     * `URI.parse('file://' + path)` because the path might contain characters that are
     * interpreted (# and ?). See the following sample:
     * ```ts
        const good = URI.file('/coding/c#/project1');
        good.scheme === 'file';
        good.path === '/coding/c#/project1';
        good.fragment === '';
        const bad = URI.parse('file://' + '/coding/c#/project1');
        bad.scheme === 'file';
        bad.path === '/coding/c'; // path is now broken
        bad.fragment === '/project1';
        ```
     *
     * @param path A file system path (see `URI#fsPath`)
     */
    URI.fromFile = function (path) {
        var authority = _empty;
        // normalize to fwd-slashes on windows,
        // on other systems bwd-slashes are valid
        // filename character, eg /f\oo/ba\r.txt
        if (os_1.IS_WINDOWS) {
            path = path.replace(/\\/g, _slash);
        }
        // check for authority as used in UNC shares
        // or use the path as given
        if (path[0] === _slash && path[1] === _slash) {
            var idx = path.indexOf(_slash, 2);
            if (idx === -1) {
                authority = path.substring(2);
                path = _slash;
            }
            else {
                authority = path.substring(2, idx);
                path = path.substring(idx) || _slash;
            }
        }
        return new URI('file', authority, path, _empty, _empty);
    };
    /**
     * Creates a string representation for this URI. It's guaranteed that calling
     * `URI.parse` with the result of this function creates an URI which is equal
     * to this URI.
     *
     * * The result shall *not* be used for display purposes but for externalization or transport.
     * * The result will be encoded using the percentage encoding and encoding happens mostly
     * ignore the scheme-specific encoding rules.
     *
     * @param skipEncoding Do not encode the result, default is `true`
     */
    URI.prototype.toString = function (skipEncoding) {
        if (skipEncoding === void 0) { skipEncoding = true; }
        return _toString(this, skipEncoding);
    };
    return URI;
}());
exports.URI = URI;
/*******************************************************************************
 * decoding URI
 ******************************************************************************/
function decodeURIComponentGraceful(str) {
    try {
        return decodeURIComponent(str);
    }
    catch (_a) {
        if (str.length > 3) {
            return str.substr(0, 3) + decodeURIComponentGraceful(str.substr(3));
        }
        else {
            return str;
        }
    }
}
var _rEncodedAsHex = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
function percentDecode(str) {
    if (!str.match(_rEncodedAsHex)) {
        return str;
    }
    return str.replace(_rEncodedAsHex, function (match) { return decodeURIComponentGraceful(match); });
}
// reserved characters: https://tools.ietf.org/html/rfc3986#section-2.2
var encodeTable = (_a = {},
    _a[charCode_1.CharCode.Colon] = '%3A',
    _a[charCode_1.CharCode.Slash] = '%2F',
    _a[charCode_1.CharCode.QuestionMark] = '%3F',
    _a[charCode_1.CharCode.Hash] = '%23',
    _a[charCode_1.CharCode.OpenSquareBracket] = '%5B',
    _a[charCode_1.CharCode.CloseSquareBracket] = '%5D',
    _a[charCode_1.CharCode.AtSign] = '%40',
    _a[charCode_1.CharCode.ExclamationMark] = '%21',
    _a[charCode_1.CharCode.DollarSign] = '%24',
    _a[charCode_1.CharCode.Ampersand] = '%26',
    _a[charCode_1.CharCode.SingleQuote] = '%27',
    _a[charCode_1.CharCode.OpenParen] = '%28',
    _a[charCode_1.CharCode.CloseParen] = '%29',
    _a[charCode_1.CharCode.Asterisk] = '%2A',
    _a[charCode_1.CharCode.Plus] = '%2B',
    _a[charCode_1.CharCode.Comma] = '%2C',
    _a[charCode_1.CharCode.Semicolon] = '%3B',
    _a[charCode_1.CharCode.Equals] = '%3D',
    _a[charCode_1.CharCode.Space] = '%20',
    _a);
function encodeURIComponentFast(uriComponent, allowSlash) {
    var res = undefined;
    var nativeEncodePos = -1;
    for (var pos = 0; pos < uriComponent.length; pos++) {
        var code = uriComponent.charCodeAt(pos);
        // unreserved characters: https://tools.ietf.org/html/rfc3986#section-2.3
        if ((code >= charCode_1.CharCode.a && code <= charCode_1.CharCode.z)
            || (code >= charCode_1.CharCode.A && code <= charCode_1.CharCode.Z)
            || (code >= charCode_1.CharCode.Digit0 && code <= charCode_1.CharCode.Digit9)
            || code === charCode_1.CharCode.Dash
            || code === charCode_1.CharCode.Period
            || code === charCode_1.CharCode.Underline
            || code === charCode_1.CharCode.Tilde
            || (allowSlash && code === charCode_1.CharCode.Slash)) {
            // check if we are delaying native encode
            if (nativeEncodePos !== -1) {
                res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
                nativeEncodePos = -1;
            }
            // check if we write into a new string (by default we try to return the param)
            if (res !== undefined) {
                res += uriComponent.charAt(pos);
            }
        }
        else {
            // encoding needed, we need to allocate a new string
            if (res === undefined) {
                res = uriComponent.substr(0, pos);
            }
            // check with default table first
            var escaped = encodeTable[code];
            if (escaped !== undefined) {
                // check if we are delaying native encode
                if (nativeEncodePos !== -1) {
                    res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
                    nativeEncodePos = -1;
                }
                // append escaped variant to result
                res += escaped;
            }
            else if (nativeEncodePos === -1) {
                // use native encode only when needed
                nativeEncodePos = pos;
            }
        }
    }
    if (nativeEncodePos !== -1) {
        res += encodeURIComponent(uriComponent.substring(nativeEncodePos));
    }
    return res !== undefined ? res : uriComponent;
}
function encodeURIComponentMinimal(path) {
    var res = undefined;
    for (var pos = 0; pos < path.length; pos++) {
        var code = path.charCodeAt(pos);
        if (code === charCode_1.CharCode.Hash || code === charCode_1.CharCode.QuestionMark) {
            if (res === undefined) {
                res = path.substr(0, pos);
            }
            res += encodeTable[code];
        }
        else {
            if (res !== undefined) {
                res += path[pos];
            }
        }
    }
    return res !== undefined ? res : path;
}
function _toString(uri, skipEncoding) {
    var encoder = !skipEncoding ? encodeURIComponentFast : encodeURIComponentMinimal;
    var res = '';
    var scheme = uri.scheme, authority = uri.authority, path = uri.path, query = uri.query, fragment = uri.fragment;
    if (scheme) {
        res += scheme;
        res += ':';
    }
    if (authority || scheme === 'file') {
        res += _slash;
        res += _slash;
    }
    if (authority) {
        var idx = authority.indexOf('@');
        if (idx !== -1) {
            // <user>@<auth>
            var userinfo = authority.substr(0, idx);
            authority = authority.substr(idx + 1);
            idx = userinfo.indexOf(':');
            if (idx === -1) {
                res += encoder(userinfo, false);
            }
            else {
                // <user>:<pass>@<auth>
                res += encoder(userinfo.substr(0, idx), false);
                res += ':';
                res += encoder(userinfo.substr(idx + 1), false);
            }
            res += '@';
        }
        authority = authority.toLowerCase();
        idx = authority.indexOf(':');
        if (idx === -1) {
            res += encoder(authority, false);
        }
        else {
            // <auth>:<port>
            res += encoder(authority.substr(0, idx), false);
            res += authority.substr(idx);
        }
    }
    if (path) {
        // lower-case windows drive letters in /C:/fff or C:/fff
        if (path.length >= 3 && path.charCodeAt(0) === charCode_1.CharCode.Slash && path.charCodeAt(2) === charCode_1.CharCode.Colon) {
            var code = path.charCodeAt(1);
            if (code >= charCode_1.CharCode.A && code <= charCode_1.CharCode.Z) {
                path = "/" + String.fromCharCode(code + 32) + ":" + path.substr(3); // "/c:".length === 3
            }
        }
        else if (path.length >= 2 && path.charCodeAt(1) === charCode_1.CharCode.Colon) {
            var code = path.charCodeAt(0);
            if (code >= charCode_1.CharCode.A && code <= charCode_1.CharCode.Z) {
                path = String.fromCharCode(code + 32) + ":" + path.substr(2); // "/c:".length === 3
            }
        }
        // encode the rest of the path
        res += encoder(path, true);
    }
    if (query) {
        res += '?';
        res += encoder(query, false);
    }
    if (fragment) {
        res += '#';
        res += !skipEncoding ? encodeURIComponentFast(fragment, false) : fragment;
    }
    return res;
}
console.log(URI.parse("file:///usr/home"));
