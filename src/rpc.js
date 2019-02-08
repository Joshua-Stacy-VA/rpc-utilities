'use strict';

const { isPlainObject, isString, isNil } = require('lodash/lang');
const parser = require('./parser');
const formatter = require('./formatter');
const { encrypt, decrypt } = require('./encrypt');

const READABLE_DATA_FIELDS = ['name', 'args', 'raw', 'response', 'encrypted', 'cipher'];


/**
 * The **RPC** class represents the data associated with a single RPC.
 */
class RPC {
    constructor(data, options = {}) {
        const { encrypted = false, cipher = 'VA' } = options;

        this.data = { encrypted };
        if (encrypted) {
            this.data.cipher = cipher;
        }

        if (!isNil(data)) {
            this.request(data);
        }

        const methods = Object.getOwnPropertyNames(RPC.prototype).filter(name => !name.startsWith('_'));
        return new Proxy(this, {
            get: (object, key) => {
                if (methods.includes(key)) {
                    return this[key].bind(this);
                }
                if (READABLE_DATA_FIELDS.includes(key)) {
                    return this.data[key];
                }
                return null;
            },
        });
    }

    encrypted(value) {
        if (typeof value === 'boolean') {
            this.data.encrypted = value;

            // Only set the value of the cipher if the 'encrypted' flag is set to true
            if (!value) {
                Reflect.deleteProperty(this.data, 'cipher');
            } else {
                this.data.cipher = this.data.cipher || 'VA';
            }
        }
        return this.data.encrypted;
    }

    cipher(value) {
        if (typeof value === 'string') {
            this.data.cipher = value;
        }
        return this.data.cipher;
    }

    /**
     * Add multiple data fields, via JS object, to the managed data.
     * @param  {Object} data JS object containing the objects to set.
     */
    extend(data) {
        Object.assign(this.data, data);
    }

    /**
     * Set the **RPC** `request` data.  The **RPC** class instances can be initialized with multiple types
     * of data:
     * * Raw RPC request (`String`): a raw RPC string
     * * RPC Object (`Object`): an RPC object with `name` and `args` fields. `name` should be the string name of the
     * RPC represented by the object, and `args` should be an array of arguments associated with the RPC call.
     * @param {String|Object} data The data to set the `request` data with.
     */
    request(data, options = {}) {
        const { throwOnError = false } = options;

        const request = this._transformRequest(data);
        if (request instanceof Error) {
            if (throwOnError) {
                throw request;
            }
            return request;
        }

        this.extend(request);
        return null;
    }

    _transformRequest(data) {
        if (isPlainObject(data)) {
            return this._requestFromObject(data);
        }
        if (isString(data)) {
            return this._requestFromRaw(data);
        }
        return new Error('Invalid request data');
    }

    _requestFromObject(data = {}) {
        const { name, args = [] } = data;
        if (isNil(name)) {
            return new Error(`Invalid request data: ${JSON.stringify(data, null, 4)}`);
        }

        const { encrypted, cipher = 'VA' } = this.data;
        const rpcArgs = encrypted ? args.map(arg => encrypt(arg, cipher)) : args;

        const raw = formatter.buildRpcString(name, rpcArgs);
        this.extend({ name, args, raw });
    }

    _requestFromRaw(data) {
        const raw = data.toString();
        const { name, args = [] } = parser.parseRawRPC(raw);

        if (isNil(name)) {
            return new Error(`Invalid request data: ${data}`);
        }

        const { encrypted, cipher = 'VA' } = this.data;
        const rpcArgs = encrypted ? args.map(arg => decrypt(arg, cipher)) : args;

        this.extend({ name, args: rpcArgs, raw });
    }

    /**
     * Return the data maintained by the **RPC** instance as a JS object.
     * @return {Object} A cloned copy of the data managed by the object.
     */
    toJSON() {
        return this.data;
    }

    /**
     * Set the RPC `response` data from an emulation response. This is typically either an array or a value.
     * @param {String|Number|Array} value Response values to set as the **RPC** `result`.
     */
    responseFromValue(value) {
        this.extend({
            response: {
                raw: formatter.buildResponseString(value),
                value,
            },
        });
    }

    /**
     * Set the RPC `response` data from a raw RPC response string.
     * @param {String} value Raw RPC string to set as the **RPC** `result`.
     */
    responseFromRaw(raw) {
        this.extend({
            response: {
                raw,
                value: parser.parseRawResults(raw),
            },
        });
    }

    /**
     * Check if the **RPC** object has any response data associated with it.
     * @return {Boolean} true if the object has response data, false if not.
     */
    hasResponse() {
        return !!(this.data.response);
    }
}

module.exports = RPC;
