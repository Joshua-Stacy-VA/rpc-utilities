'use strict';

const { isNil, isPlainObject } = require('lodash/lang');
const { format } = require('util');
const rpcUtils = require('./utils');

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

        return map;
    }, []);

    return list;
};

const buildLiteralParamString = valueString => format('%s%sf', '0', strPack(valueString));

const buildReferenceParamString = valueString => format('%s%sf', '1', strPack(valueString));

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

const buildRpcGreetingString = (ipAddress, hostname) => (
    format('[XWB]10304\nTCPConnect5%s0%sf%s%s',
        buildLiteralParamString(ipAddress),
        strPack('0'),
        buildLiteralParamString(hostname),
        rpcUtils.EOT)
);

const buildRpcSignOffString = () => format('[XWB]10304%s#BYE#%s', rpcUtils.ENQ, rpcUtils.EOT);

const prependCount = string => `${String.fromCharCode(string.length)}${string}`;

const buildParamRpcString = (paramStringList) => {
    if (paramStringList === null || paramStringList === undefined || paramStringList.length === 0) {
        return '54f';
    }

    const paramStringParts = paramStringList.map(arg => (
        isPlainObject(arg) ? buildListParamString(makeKeyValueListFromObject(arg)) : buildLiteralParamString(arg)
    ));
    paramStringParts.unshift('5');

    return paramStringParts.join('');
};

const buildRpcString = (rpcName, paramStringList) => (
    format('%s11302%s%s%s%s',
        rpcUtils.PREFIX,
        prependCount(rpcUtils.RPC_VERSION),
        prependCount(rpcName),
        buildParamRpcString(paramStringList),
        rpcUtils.EOT)
);

const encapsulate = str => `${rpcUtils.NUL}${rpcUtils.NUL}${str}${rpcUtils.EOT}`;

const stripMarkers = (str) => {
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
