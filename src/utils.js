'use strict';

const isNumber = require('lodash.isnumber');
const isString = require('lodash.isstring');
const trimStart = require('lodash.trimstart');

/**
 * @module Utils
 * @ignore
 */

const NUL = '\u0000';
const SOH = '\u0001';
const EOT = '\u0004';
const ENQ = '\u0005';

const PREFIX = '[XWB]';
const RPC_VERSION = '1.108';
const COUNT_WIDTH = 3;

// =============================== RPC Formatting/Parsing Utilities ================================
const removeLeftPad = lPaddedNum => (isString(lPaddedNum) ? trimStart(lPaddedNum, '0') : null);

/**
 * Checks the length of the packed string and strips of the length from the payload. Needs to be of the form
 * dSS...SS where d is the length as a char of the payload and SS...SS is the payload
 *
 * @param sPack
 * @returns the payload string, or null sPack is not in the proper form
 */
const unSPack = (sPack) => {
    if (!isString(sPack)) {
        return null;
    }
    const length = sPack.charCodeAt(0);
    return (length === sPack.length - 1) ? sPack.substring(1) : null;
};

/**
 * Takes a string that has an SPack on the front, removes the SPack and returns the SPack payload and the remainder of the
 * string.
 *
 * @param sPack
 * @returns object containing spack payload, and the remaining string
 */
const popSPack = (sPack) => {
    if (!isString(sPack)) {
        return null;
    }
    const length = sPack.charCodeAt(0);
    const string = sPack.substring(1, length + 1);
    const remainder = (sPack.length > length + 1) ? sPack.substring(length + 1) : null;

    return { string, remainder };
};

/**
 * Takes a string that has an LPack on the front, removes the LPack, and returns the LPack payload and the remainder of the
 * string
 *
 * @param lPack
 * @returns object containing lpack payload and the remaining string
 */
const popLPack = (lPack, width = COUNT_WIDTH) => {
    if (!isString(lPack) || !isNumber(width) || !width) {
        return null;
    }

    const lengthStr = lPack.substring(0, width);
    const length = (lengthStr === '000') ? 0 : +removeLeftPad(lengthStr);

    const string = lPack.substring(width, width + length);
    const remainder = lPack.substring(width + length);

    return { string, remainder };
};

/**
 * Unpack an LPacked structure
 *
 * @param lPack the package in the form dd...ddSSS...SSS where dd...dd is the length digits long and SSS...SSS is the payload of length dd...dd
 * @param digits number of digits of the length to unpack (needs to be an integer)
 * @returns an object with the "string" payload and the "width" ndigits, or null if not a proper lpack. ("string" and "width" property names come from VistaJSLibrary parameter names for strPack())
 */
const unLPack = (lPack, digits) => {
    if (!isString(lPack)) {
        return null;
    }
    let string = '';
    let width = 0;

    if (digits && isNumber(digits)) { // this case makes it easier
        const length = +removeLeftPad(lPack.substring(0, digits)); // this should be the length of the payload
        string = lPack.substring(digits);
        width = (string.length === length) ? digits : 0;
    } else { // this is a little harder
        const packedLength = lPack.length;
        const strippedPack = removeLeftPad(lPack); // remove any leading zeros
        const strippedPackLength = strippedPack.length;

        const digitCount = Math.ceil(Math.log10(strippedPackLength));
        Array.from({ length: digitCount }, (v, i) => i + 1).some((index) => {
            const length = +strippedPack.substring(0, index);
            const foundLength = (length && isNumber(length) && (length === strippedPackLength - index));
            if (foundLength) {
                string = strippedPack.substring(index);
            }
            return foundLength;
        });
        width = (string) ? (strippedPackLength - string.length) + (packedLength - strippedPackLength) : 0;
    }

    return (width) ? { string, width } : null;
};

module.exports = {
    NUL,
    SOH,
    EOT,
    ENQ,
    PREFIX,
    RPC_VERSION,
    COUNT_WIDTH,
    removeLeftPad,
    unLPack,
    unSPack,
    popSPack,
    popLPack,
};
