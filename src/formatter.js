'use strict';

const { isNil, isPlainObject, isString } = require('lodash/lang');
const { format } = require('util');
const rpcUtils = require('./utils');

/**
 * @module Formatter
 */

/**
 * Utility method that prepends a zero-padded string length to a given string.
 * @param  val - The value to "pack". Whatever is passed in will be converted to a string.
 * @param  {number} [width=rpcUtils.COUNT_WIDTH] - The width of the prepended string, defaulting to 3.
 * @return {String} A string comprised of: `{length prefix}{string}
 * @example
 * strPack('HELLO WORLD', 4);  // returns '0011HELLO WORLD'
 * strPack('TESTING123');  //returns '010TESTING123'
 */
const strPack = (val, width = rpcUtils.COUNT_WIDTH) => {
    const str = val.toString();
    const prefix = str.length.toString().padStart(width, '0');
    return `${prefix}${str}`;
};

const makeKeyValueListFromObject = (objectValue) => {
    const list = Object.keys(objectValue).reduce((map, key) => {
        const value = objectValue[key];
        if (!Array.isArray(value)) {
            map.push({ key, value });
            return map;
        }

        const results = value.map((val, index) => ({
            key: `${key},${index + 1}`,
            value: val,
        }));

        results.unshift({
            key: `${key},0`,
            value: value.length,
        });

        return map.concat(results);
    }, []);

    return list;
};

/**
 * Convenience method that builds a `LITERAL` (type 0) parameter string from a value.
 * @param  valueString - Value to build the `LITERAL` parameter string from
 * @return {String} The "packed" parameter string.
 */
const buildLiteralParamString = valueString => format('%s%sf', '0', strPack(valueString));

/**
 * Convenience method that builds a `REFERENCE` (type 1) parameter string from a value.
 * @param  valueString - Value to build the `REFERENCE` parameter string from
 * @return {String} The "packed" parameter string.
 */
const buildReferenceParamString = valueString => format('%s%sf', '1', strPack(valueString));

/**
 * @typedef {Object} ListObject
 * @property {String|Number} key - The object key
 * @property {String|Number} value - The value of the keyed object
 */

/**
 * Construct a `LIST` (type 2) parameter string from list of object-based parameters. Note that each object
 * value passed into the list should
 * @param {ListObject[]} valueList - Values to build the `LIST` parameter string from
 * @return {String} The "packed" parameter string.
 */
const buildListParamString = (valueList) => {
    // each list item should be: { key: '', value: '' }
    if (valueList === null || valueList === undefined || valueList.length === 0) {
        return `${strPack('')}f`;
    }

    const paramString = valueList.reduce((first, second) => {
        const paramName = second.key;
        let paramValue = second.value;

        if (paramValue === null || paramValue === undefined || paramValue.length === 0) {
            paramValue = rpcUtils.SOH;
        }

        return first + format('%s%st', strPack(paramName), strPack(paramValue));
    }, '');

    return format('%s%sf', '2', paramString.substring(0, paramString.length - 1));
};

/**
 * Convenience function to build a greeting (`TCPConnect`) string given an IP address and a hostname. This
 * is the initial RPC that needs to be sent to initiate a VistA connection.
 * @param  {String} ipAddress - Host IP address
 * @param  {String} hostname  - Hostname
 * @return {String} The RPC greeting string
 */
const buildRpcGreetingString = (ipAddress, hostname) => (
    format('[XWB]10304\nTCPConnect5%s0%sf%s%s',
        buildLiteralParamString(ipAddress),
        strPack('0'),
        buildLiteralParamString(hostname),
        rpcUtils.EOT)
);

/**
 * Convenience function to build a sign-off (`BYE`) RPC string. This is the final RPC string that needs to be
 * sent to close a VistA connection session.
 * @return {String} The RPC sign-off string
 */
const buildRpcSignOffString = () => format('[XWB]10304%s#BYE#%s', rpcUtils.ENQ, rpcUtils.EOT);

/**
 * Prepend the hexadecimal reprsentation of a string's length to the string itself.
 * @param  {String} string - The string to prepend
 * @return {String} The string with the length, in Unicode-length (2-byte) hex, appended
 * @example
 * prependCount('HELLO WORLD'); // returns '\u000bHELLO WORLD'
 */
const prependCount = string => `${String.fromCharCode(string.length)}${string}`;

/**
 * Build an RPC-protocol based parameter string based on a list of parameter arguments
 * @param  {Array} paramStringList - List of arguments to format into a parameter string
 * @return {String} Parameter string, or '54f' if the value was invalid
 */
const buildParamRpcString = (paramStringList) => {
    if (paramStringList === null || paramStringList === undefined || paramStringList.length === 0) {
        return '54f';
    }

    const paramStringParts = paramStringList.map((arg) => {
        if (!isPlainObject(arg)) {
            return buildLiteralParamString(arg);
        }
        if (arg.type === 'REFERENCE') {
            return buildReferenceParamString(arg.value);
        }
        return buildListParamString(makeKeyValueListFromObject(arg));
    });
    paramStringParts.unshift('5');

    return paramStringParts.join('');
};

/**
 * Build a raw RPC-protocol string, given an RPC name and a list of parameters. This is the most commonly
 * used function of the utility module.
 * @param  {String} rpcName - Name of the RPC
 * @param  {Array} paramStringList - List of arguments
 * @return {String} The raw RPC-protocol formatted string
 */
const buildRpcString = (rpcName, paramStringList) => {
    if (isNil(rpcName)) {
        return '';
    }

    const name = rpcName.toString();
    if (name === 'TCPConnect') {
        const [ipAddress = '127.0.0.1', , hostname = 'localhost'] = paramStringList;
        return buildRpcGreetingString(ipAddress, hostname);
    }
    if (name === '#BYE#') {
        return buildRpcSignOffString();
    }
    return format('%s11302%s%s%s%s',
        rpcUtils.PREFIX,
        prependCount(rpcUtils.RPC_VERSION),
        prependCount(rpcName),
        buildParamRpcString(paramStringList),
        rpcUtils.EOT);
};

/**
 * Utility method to encapsulate a string with special marker characters. These marker characters are required
 * by the raw RPC protocol to denote a valid RPC string.
 * @param  {String} str - The string to encapsulate
 * @return {String} The encapsulated string
 * @example
 * encapsulate('HELLO WORLD'); // returns '\u0000\u0000HELLO WORLD\u0004'
 */
const encapsulate = str => `${rpcUtils.NUL}${rpcUtils.NUL}${str}${rpcUtils.EOT}`;

/**
 * Utility method to remove the special marker characters from a string.
 * @param  {String} str - The encapsulated string
 * @return {String} The unencapsulated string
 * @see encapsulate
 * @example
 * stripMarkers('\u0000\u0000HELLO WORLD\u0004'); // returns 'HELLO WORLD'
 */
const stripMarkers = (str) => {
    if (!isString(str)) {
        return str;
    }

    if (str.indexOf(rpcUtils.NUL + rpcUtils.NUL) === 0 && str.indexOf(rpcUtils.EOT) === str.length - 1) {
        return str.substring(2, str.length - 1);
    }
    return str;
};

/**
 * Build an appropriately formatted RPC response string.
 *
 * NOTE: In rpcRunner the ARRAY, WORD PROCESSING, and GLOBAL ARRAY returns an array as the replyType
 * @param  {Object|Array|String|Number} resp The raw response to format
 * @return {String}                          RPC formatted response
 */
const buildResponseString = (resp) => {
    let result = '';
    if (!isNil(resp)) {
        result = Array.isArray(resp) ? resp.map(val => `${val.toString()}\r\n`).join('') : resp.toString();
    }

    return encapsulate(result);
};

module.exports = {
    buildRpcString,
    buildLiteralParamString,
    buildReferenceParamString,
    buildListParamString,
    buildRpcGreetingString,
    buildRpcSignOffString,
    encapsulate,
    stripMarkers,
    prependCount,
    strPack,
    buildResponseString,
};
