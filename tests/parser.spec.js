'use strict';

const {
    parseRawRPC,
    parseRawResults,
    parseParameters,
    inputParametersToArgs,
    isValidRawRPC,
} = require('../src/parser');

const TCP_CONNECT_RAW = '[XWB]10304\nTCPConnect50009127.0.0.1f0009TESTS61BFf\u0004';
const TCP_CONNECT_INVALID_RAW = '11302\u00051.108\u000aTCPConnect50009127.0.0.1f0009TESTS61BFf\u0004';
const BYE_RAW = '[XWB]10304\u0005#BYE#\u0004';
const VALID_RAW = '[XWB]11302\u00051.108\u0010XUS SIGNON SETUP500011f0004TESTf\u0004';
const VALID_REFERENCE_RAW = '[XWB]11302\u00051.108\u0010XUS SIGNON SETUP510011f0011HELLO WORLD\u0004';
const VALID_LIST_RAW = '[XWB]11302\u00010\u0015ORWDAL32 SAVE ALLERGY52009"GMRAGNT"024CHOCOLATE^3;GMRD(120.82,t010"GMRATYPE"012DF^Drug,Foodt010"GMRANATR"009A^Allergyt010"GMRAORIG"00261t010"GMRAORDT"0123170121.0429t012"GMRASYMP",00011t012"GMRASYMP",101799^HYPOTENSION^^^f\u0004';
const VALID_LIST_OBJ_RAW = '[XWB]11302\u00010\u0015ORWDAL32 SAVE ALLERGY52005a,b,c004TESTf';

test('parseRawRPC', () => {
    expect(parseRawRPC('{XWB}')).toEqual(expect.objectContaining({ name: '#REJECT#' }));
    expect(parseRawRPC(TCP_CONNECT_RAW)).toEqual(expect.objectContaining({
        name: 'TCPConnect',
        args: ['127.0.0.1', 'TESTS61BF'],
    }));
    expect(parseRawRPC(TCP_CONNECT_INVALID_RAW)).toEqual(expect.objectContaining({ name: '#REJECT#' }));
    expect(parseRawRPC(BYE_RAW)).toEqual(expect.objectContaining({
        name: '#BYE#',
        args: [],
    }));
    expect(parseRawRPC(VALID_RAW)).toEqual(expect.objectContaining({
        name: 'XUS SIGNON SETUP',
        args: ['1', 'TEST'],
    }));
    expect(parseRawRPC(VALID_REFERENCE_RAW)).toEqual(expect.objectContaining({
        name: 'XUS SIGNON SETUP',
        args: [{ type: 'REFERENCE', value: '1' }, 'HELLO WORLD'],
    }));
    expect(parseRawRPC(VALID_LIST_RAW)).toEqual(expect.objectContaining({
        name: 'ORWDAL32 SAVE ALLERGY',
        args: [{
            GMRAGNT: 'CHOCOLATE^3;GMRD(120.82,',
            GMRATYPE: 'DF^Drug,Food',
            GMRANATR: 'A^Allergy',
            GMRAORIG: '61',
            GMRAORDT: '3170121.0429',
            GMRASYMP: ['99^HYPOTENSION^^^'],
        }],
    }));
    expect(parseRawRPC(VALID_LIST_OBJ_RAW)).toEqual(expect.objectContaining({
        name: 'ORWDAL32 SAVE ALLERGY',
        args: [{ a: { b: { c: 'TEST' } } }],
    }));
});

test('parseRawResults', () => {
    expect(parseRawResults()).toBe('');
    expect(parseRawResults(1)).toBe('1');
    expect(parseRawResults('\u0000THIS IS A TEST\u0004')).toBe('THIS IS A TEST');
    expect(parseRawResults('\u0000THIS\r\nIS\r\nA\r\nTEST\u0004')).toEqual(['THIS', 'IS', 'A', 'TEST']);
});

test('parseParameters', () => {
    expect(parseParameters()).toBeNull();
    expect(parseParameters('')).toBeNull();
    expect(parseParameters('54f')).toEqual({});
    expect(parseParameters('59005ABCDEf')).toEqual([]);
});

test('inputParametersToArgs', () => {
    expect(inputParametersToArgs({ name: 'NOT AN ARRAY' })).toEqual([]);
});

test('isValidRawRPC', () => {
    expect(isValidRawRPC('[XWB]11302\u00010\fORWPS REASON54f\u0004')).toBeTruthy();
    expect(isValidRawRPC({ name: 'THIS IS AN OBJECT NOT A STRING' })).toBeFalsy();
});
