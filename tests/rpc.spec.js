'use strict';

const RPC = require('../src/rpc');

describe('Initialization', () => {
    test('Default constructor', () => {
        const rpc = new RPC();
        expect(rpc.encrypted()).toBeFalsy();
        expect(rpc.cipher()).toBeUndefined();
    });
    test('Constructor with options', () => {
        const rpc = new RPC({}, { encrypted: true });
        expect(rpc.encrypted()).toBeTruthy();
        expect(rpc.cipher()).toBe('VA');
    });
    describe('Constructor with data', () => {
        test('Constructor with JSON data', () => {
            const rpc = new RPC({ name: 'ORWU DT', args: ['DT'] });
            expect(rpc.name).toBe('ORWU DT');
            expect(rpc.args).toEqual(['DT']);
            expect(rpc.raw).toBe('[XWB]11302\u00051.108\u0007ORWU DT50002DTf\u0004');
        });
        test('Constructor with raw data', () => {
            const rpc = new RPC('[XWB]11302\u00051.108\u0010XUS SIGNON SETUP500011f0004TESTf\u0004');
            expect(rpc.name).toBe('XUS SIGNON SETUP');
            expect(rpc.args).toEqual(['1', 'TEST']);
            expect(rpc.raw).toBe('[XWB]11302\u00051.108\u0010XUS SIGNON SETUP500011f0004TESTf\u0004');
        });
    });
});

describe('Getters/Setters', () => {
    test('Property fields', () => {
        const rpc = new RPC();
        rpc.encrypted(true);
        expect(rpc.encrypted()).toBeTruthy();
        expect(rpc.cipher()).toBe('VA');

        rpc.cipher('OSEHRA');
        expect(rpc.cipher()).toBe('OSEHRA');

        rpc.encrypted(false);
        expect(rpc.encrypted()).toBeFalsy();
        expect(rpc.cipher()).toBeUndefined();

        expect(rpc.doesntExist).toBeNull();
    });
    test('JSON/Extend', () => {
        const rpc = new RPC({ name: 'ORWU DT', args: ['DT'] });
        expect(rpc.toJSON()).toEqual(expect.objectContaining({
            raw: '[XWB]11302\u00051.108\u0007ORWU DT50002DTf\u0004',
            name: 'ORWU DT',
            args: ['DT'],
        }));

        rpc.extend({ testId: 'ABCDE12345' });
        expect(rpc.toJSON()).toEqual(expect.objectContaining({
            testId: 'ABCDE12345',
        }));
    });
});

describe('Requests', () => {
    test('Positive conditions', () => {
        const rpc = new RPC();
        rpc.request({ name: 'ORWU DT', args: ['DT'] });
        expect(rpc.toJSON()).toEqual(expect.objectContaining({
            raw: '[XWB]11302\u00051.108\u0007ORWU DT50002DTf\u0004',
            name: 'ORWU DT',
            args: ['DT'],
        }));

        rpc.request('[XWB]11302\u00051.108\u0010XUS SIGNON SETUP500011f0004TESTf\u0004');
        expect(rpc.toJSON()).toEqual(expect.objectContaining({
            raw: '[XWB]11302\u00051.108\u0010XUS SIGNON SETUP500011f0004TESTf\u0004',
            name: 'XUS SIGNON SETUP',
            args: ['1', 'TEST'],
        }));

        rpc.encrypted(true);
        rpc.request({ name: 'XUX PASSWORD', args: ['ABCDE12345'] });
        const resultJSON = rpc.toJSON();
        expect(resultJSON).toEqual(expect.objectContaining({
            name: 'XUX PASSWORD',
        }));
        expect(resultJSON.args.length).toBe(1);

        rpc.request('[XWB]11302\u00051.108\u000cXUX PASSWORD50012*AjHi[N@O-\\(f\u0004');
        expect(rpc.toJSON()).toEqual(expect.objectContaining({
            name: 'XUX PASSWORD',
            args: ['ABCDE12345'],
        }));
    });
    test('Negative conditions', () => {
        const rpc = new RPC();
        expect(rpc.request({ args: [] })).toBeInstanceOf(Error);
        expect(rpc.request('')).toBeInstanceOf(Error);
        expect(rpc.request(null)).toMatchObject(new Error('Invalid request data'));
        expect(rpc.request.bind(rpc, null, { throwOnError: true })).toThrow();
    });
});

describe('Responses', () => {
    test('From value', () => {
        const rpc = new RPC();
        expect(rpc.hasResponse()).toBeFalsy();

        const value = ['ABCDE12345', 'TESTING'];
        rpc.responseFromValue(value);
        expect(rpc.response).toEqual(expect.objectContaining({
            value,
            raw: '\u0000\u0000ABCDE12345\r\nTESTING\r\n\u0004',
        }));
        expect(rpc.hasResponse()).toBeTruthy();
    });
    test('From raw data', () => {
        const rpc = new RPC();
        expect(rpc.hasResponse()).toBeFalsy();

        const raw = '\u0000\u0000SINGLE_VALUE\u0004';
        rpc.responseFromRaw(raw);
        expect(rpc.response).toEqual(expect.objectContaining({
            value: 'SINGLE_VALUE',
            raw,
        }));
        expect(rpc.hasResponse()).toBeTruthy();
    });
});
