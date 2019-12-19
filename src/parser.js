'use strict';

const trimStart = require('lodash.trimstart');
const trimEnd = require('lodash.trimend');
const isString = require('lodash.isstring');
const rpcUtils = require('./utils');

/**
 * @module Parser
 */

/**
 * @typedef {Object} RPCObject
 * @property {String} name - The name of the RPC
 * @property {Array} args - The list of RPC argument values
 * @property {String} version - The attached version of the RPC protocol used
 */

const parameterTypeReverseMap = {
    0: 'LITERAL',
    1: 'REFERENCE',
    2: 'LIST',
    3: 'GLOBAL',
};

/**
 * Parse the parameters section of a raw RPC string and create an array of argument values.
 * @param  {String} paramRpcString - The parameter section of a raw RPC string
 * @return {Array} List of parameters, or null if the string was invalid
 */
const parseParameters = (paramRpcString) => {
    if (!paramRpcString || paramRpcString.indexOf('5') !== 0) {
        return null;
    }

    if (paramRpcString === '54f') {
        return {};
    }

    // remove the '5' paramRpcString.substring(1);
    let remainderString = paramRpcString.substring(1);
    const parameters = [];
    let parameterNum = 1;
    let isParsing = true;

    while (remainderString.length > rpcUtils.COUNT_WIDTH && isParsing) {
        // get the parameter type
        const paramtype = remainderString.substring(0, 1);
        const paramtypeName = parameterTypeReverseMap[paramtype];

        if (paramtype === '0' || paramtype === '1') {
            // LITERAL and REFERENCE type params are treated the same way
            const poppedObject = rpcUtils.popLPack(remainderString.substring(1));
            remainderString = poppedObject.remainder;
            if (remainderString && remainderString.length > 0) {
                // remove the 'f' marking the end of the parameter.
                remainderString = remainderString.substring(1);
            }
            parameterNum += 1;
            parameters.push({ parameterType: paramtypeName, parameter: poppedObject.string, num: parameterNum });
        } else if (paramtype === '2' || paramtype === '3') {
            // LIST type parameters need to remove LPacks two at a time for key/value pairs.
            // remove the paramtype
            remainderString = remainderString.substring(1);

            // pop two LPacks until it ends with a 'f'
            const listParams = [];
            let endoflist = false;
            while (!endoflist && remainderString.length) {
                const poppedKeyObject = rpcUtils.popLPack(remainderString);
                remainderString = poppedKeyObject.remainder;
                const poppedValueObject = rpcUtils.popLPack(remainderString);
                remainderString = poppedValueObject.remainder;

                // push a key/value pair onto the list parameter array
                // turn value of SOH into "" as the MUMPS broker does in XWBPRS/LINST.
                const value = (poppedValueObject.string === rpcUtils.SOH) ? '' : poppedValueObject.string;
                listParams.push({ key: poppedKeyObject.string, value });

                // remove the 't' or 'f'
                if (remainderString.substring(0, 1) === 'f') {
                    endoflist = true;
                }
                remainderString = remainderString.substring(1);
            }
            if (listParams.length > 0) {
                parameterNum += 1;
                parameters.push({ parameterType: paramtypeName, parameter: listParams, num: parameterNum });
            }
        } else {
            isParsing = false;
        }
    }

    return parameters;
};

/**
 * Convert a list of input argument values into an `args` array.
 *
 * Main change is to "List Parameters". In general:
 *     `[{"key":"1", "value":"ABC"}, {"key":"2", "value":"DEF"}, {"key":"3", "value":"GHI"}]`
 *
 * becomes:
 *     `{"1": "ABC", "2": "DEF", "3": "GHI"}`
 *
 * as the args object.
 * @param {Array} rpcObjectInputParameters - The rpcObject.inputParameters array.
 * @returns {Array} the input parameters as array of the "parameter" values or arrays without the types and ordinals.
 */
const inputParametersToArgs = (rpcObjectInputParameters) => {
    const args = [];

    if (!Array.isArray(rpcObjectInputParameters)) {
        return args;
    }

    for (let paramnum = 0; paramnum < rpcObjectInputParameters.length; paramnum += 1) {
        if (rpcObjectInputParameters[paramnum].parameterType === 'LIST') {
            const parameterList = rpcObjectInputParameters[paramnum].parameter;
            const listObject = {};

            for (let item = 0; item < parameterList.length; item += 1) {
                /*
                 * Three types of Keys - simple, word processing and hierachal
                 */
                let key = parameterList[item].key.replace(/"/g, '');
                const { value } = parameterList[item];

                if (!/,/.test(key)) {
                    // 1. Simple ,-less key - just assign
                    listObject[key] = value;
                } else if ((key.slice(-2) === ',0') && (/^\d+$/.test(value))) {
                    /*
                     * 2. , in Key - Word Processing
                     *
                     * takes form
                     *    {"..,0": "number of lines", "...,1": "line 1", "...,2": "line 2" ...
                     * and needs to become
                     *    ["line1", "line2" ...
                     * Note: ,0 is not enough - need to make sure value is numeric.
                     *       otherwise ORWDX SAVE fails
                     */
                    const wparray = [];
                    key = key.substring(0, key.length - 2);
                    const wpLength = parseInt(value, 10);
                    for (let subitem = item + 1; (subitem <= item + wpLength) && (subitem < parameterList.length); subitem += 1) {
                        wparray.push(parameterList[subitem].value);
                    }
                    listObject[key] = wparray;
                    // skip forward in the parameterList the WP Length
                    item += wpLength;
                } else {
                    /*
                     * 3. , in Key - Hierarchal
                     *
                     * TODO: find where this happens in the MUMPS. It does happen somewhere as
                     * otherwise ORWDX SAVE wouldn't work.
                     *
                     * hierarchal keys require a hierarchy (needed for ORWDX SAVE):
                     *     {"key": "X,Y,Z", "value": "A"} --> {"X": {"Y": {"Z": "A"}}}
                     *
                     */
                    let hlistObject = listObject;
                    key.split(',').forEach((subkey, i, subkeys) => {
                        // last (or only) subkey - assign value at this level
                        if (subkeys.length === i + 1) {
                            hlistObject[subkey] = value;
                            return;
                        }
                        // if subkey not there already then add it and go to its level
                        if (!Object.prototype.hasOwnProperty.call(hlistObject, subkey)) {
                            hlistObject[subkey] = {};
                            hlistObject = hlistObject[subkey];
                        } else {
                            // go to level of subkeyhlistObject = hlistObject[subkey];
                        }
                    });
                }
            }

            args.push(listObject);
        } else if (rpcObjectInputParameters[paramnum].parameterType === 'REFERENCE') {
            const referenceObject = {};
            referenceObject.type = 'REFERENCE';
            referenceObject.value = rpcObjectInputParameters[paramnum].parameter;
            args.push(referenceObject);
        } else { // LITERAL
            args.push(rpcObjectInputParameters[paramnum].parameter);
        }
    }

    return args;
};

/**
 * Parse a raw RPC protocol string. This is the most commonly used function of the module.
 *
 * Note: The RPCObject args Array values can be one of 3 types: LITERAL, REFERENCE, LIST
 *    * LITERAL: Any value
 *    * REFERENCE: Will be an object with `type` field set to `REFERENCE` and `value` field set to the value of the arg
 *    * LIST: A JS Object representing the parameters in the list, could be multi-levels
 *
 * @param  {String} rpcString - The raw RPC protocol string to parse.
 * @return {RPCObject} The JS object representation of the RPC, or null if the string was invalid.
 */
const parseRawRPC = (rpcString) => {
    const rpcObject = {};

    if (!isString(rpcString)) {
        return null;
    }


    if (rpcString.indexOf('{XWB}') === 0) {
        // this is direct query
        // {XWB}<MESSAGE> where <> is strPack with count_width 5
        //   MESSAGE is
        //     HDR = "007XWB;;;;"  or strPack(('XWB;;;;', 3)
        //     then for no parameter of type LIST buildApi(rpcName, parameters, "0")
        //       of buildApi(rpcName, parameters, "1") then the list of key value pairs each strPack with count_width 3 and terminated by 000
        // e.g. rpc "MY DOG" parameter: LITERAL abcde = "{XWB}007XWB;;;;000170MY DOG^000090060abcde"
        //      or "YOUR DOG" parameter: LIST (a,1) (b,2) = "{XWB}007XWB;;;;000341YOUR DOG^00019001a0011001b0012000"

        // this type of RPC is not supported so we will reject it
        rpcObject.name = '#UNSUPPORTED_FORMAT#';
        rpcObject.args = rpcString;
    } else if (rpcString.indexOf('TCPConnect') > -1) {
        // first check that the TCPConnect header fits the protocol
        if (rpcString.indexOf('[XWB]10304\nTCPConnect') === 0) {
            rpcObject.name = 'TCPConnect';

            // parse the originating IP and hostname
            // form [XWB]10<COUNT_WIDTH>04\nTCPConnect + "5" + "0" + LPack(Address, COUNT_WIDTH) + "f"
            //                                               + "0" + LPack("0", COUNT_WIDTH) + "f"
            //                                               + "0" + LPack(Name, COUNT_WIDTH + 1) + "f\u0004"
            // rpcString = rpcString.substring("[XWB]10304\nTCPConnect50".length);
            // rpcObject.ipaddress = rpcUtils.popLPack(rpcString, COUNT_WIDTH).string;
            // rpcString = rpcString.substring(2 + COUNT_WIDTH + 3);
            // rpcObject.hostName = rpcUtils.popLPack(rpcString, COUNT_WIDTH).string;

            const parametersArray = parseParameters(rpcString.substring('[XWB]10304\nTCPConnect'.length));
            // rpcObject.inputParameters = parametersArray;
            rpcObject.args = inputParametersToArgs(parametersArray);
        } else {
            // the header for the TCPConnect is not correct so we will inject a reject object
            rpcObject.name = '#REJECT#';
        }
    } else if (rpcString.indexOf('[XWB]10304\u0005#BYE#\u0004') === 0) {
        rpcObject.name = '#BYE#';
        rpcObject.args = [];
    } else if (rpcString.indexOf('[XWB]') === 0) {
        // this is national query
        // [XWB]11302<1.108><~RPCNAME~>~parameters~\u0004 where <> is an SPack
        // by parts: PREFIX="[XWB]" then "11" then COUNT_WIDTH="3" then "02" then SPack RPC_VERSION="1.108" then SPack RPC_NAME
        //    then the parameters where parameters = "5" then '0' for LITERAL, '1' for REFERENCE, '2' for LIST
        //        then for literals and reference the string is 'LPacked' for using COUNT_WIDTH of 3 and end with an 'f'
        //        for lists see list2string
        // e.g. rpc "MY DOG" parameter: LITERAL abcde = "[XWB]11301251.1086MY DOG50005abcdef"
        //      or "YOUR DOG" parameter: LIST (a,1) (b,2) = "[XWB]11301251.1088YOUR DOG52001a0011t001b0012f"

        // strip [XWB] and "11302" rpcString.substring(10);
        // get the version
        let poppedObject = rpcUtils.popSPack(rpcString.substring(10));
        const version = poppedObject.string;
        // get the rpcName
        poppedObject = rpcUtils.popSPack(poppedObject.remainder);
        const rpcName = poppedObject.string;
        const parametersArray = parseParameters(poppedObject.remainder);

        rpcObject.name = rpcName;
        rpcObject.version = version;
        // rpcObject.inputParameters = parametersArray;

        rpcObject.args = inputParametersToArgs(parametersArray);
    }
    return rpcObject;
};

/**
 * Parse raw results into key values.
 * @param  {String} [response=''] - The raw RPC response string
 * @return {Array} Array of results values
 */
const parseRawResults = (response = '') => {
    const value = trimStart(trimEnd(response.toString(), rpcUtils.EOT), rpcUtils.NUL);
    if (!value.includes('\r\n')) {
        return value;
    }

    return trimEnd(value, '\r\n').split('\r\n');
};

/**
 * Check if a string is a valid, raw RPC protocol formatted string.
 * @param  {string} rpcString - The string to check
 * @return {Boolean} True if the string was valid, false if not
 */
const isValidRawRPC = (rpcString) => {
    const rpcObject = parseRawRPC(rpcString);
    return !!(rpcObject && rpcObject.name && rpcObject.name !== '#REJECT#');
};

module.exports = {
    parseRawRPC,
    parseRawResults,
    parseParameters,
    inputParametersToArgs,
    isValidRawRPC,
};
