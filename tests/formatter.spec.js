'use strict';

const {
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
} = require('../src/formatter');

test('buildRpcString', () => {
    expect(buildRpcString('ORWU DT', [])).toBe('[XWB]11302\u00051.108\u0007ORWU DT54f\u0004');
    expect(buildRpcString('ORWU DT', ['DT'])).toBe('[XWB]11302\u00051.108\u0007ORWU DT50002DTf\u0004');
    expect(buildRpcString('ORWU DT', ['DT'])).toBe('[XWB]11302\u00051.108\u0007ORWU DT50002DTf\u0004');
    expect(buildRpcString('ORWU DT', [{
        name: 'VALUE',
        list: [1, 2, 3],
    }])).toBe('[XWB]11302\u00051.108\u0007ORWU DT52004name005VALUEt006list,00013t006list,10011t006list,20012t006list,30013f\u0004');
});

test('buildLiteralParamString', () => {
    expect(buildLiteralParamString('ABCDE12345')).toBe('0010ABCDE12345f');
});

test('buildReferenceParamString', () => {
    expect(buildReferenceParamString('ABCDE12345REF')).toBe('1013ABCDE12345REFf');
});

test('buildListParamString', () => {
    const SINGLE_PARAM_LIST = [{
        key: 'FIRST',
        value: 'FIRSTVALUE',
    }];
    expect(buildListParamString(SINGLE_PARAM_LIST)).toBe('2005FIRST010FIRSTVALUEf');

    const SINGLE_DEEP_PARAM_LIST = [{
        key: 'A,B,C',
        value: 'DEEPVALUE',
    }];
    expect(buildListParamString(SINGLE_DEEP_PARAM_LIST)).toBe('2005A,B,C009DEEPVALUEf');

    const SINGLE_ARRAY_PARAM_LIST = [{
        key: 'LIST',
        value: 'FIRST',
    }, {
        key: 'LIST',
        value: 'SECOND',
    }];
    expect(buildListParamString(SINGLE_ARRAY_PARAM_LIST)).toBe('2004LIST005FIRSTt004LIST006SECONDf');

    const INVALID_NO_KEY = [{
        key: 'JUST KEY',
    }];
    expect(buildListParamString(INVALID_NO_KEY)).toBe('2008JUST KEY001\u0001f');
    expect(buildListParamString([])).toBe('000f');
});

test('buildRpcGreetingString', () => {
    expect(buildRpcGreetingString('127.0.0.1', 'localhost')).toBe('[XWB]10304\nTCPConnect50009127.0.0.1f00010f0009localhostf\u0004');
});

test('buildRpcSignOffString', () => {
    expect(buildRpcSignOffString()).toBe('[XWB]10304\u0005#BYE#\u0004');
});

test('encapsulate', () => {
    expect(encapsulate('ABCDE12345')).toBe('\u0000\u0000ABCDE12345\u0004');
});

test('stripMarkers', () => {
    expect(stripMarkers('\u0000\u0000HELLO WORLD\u0004')).toBe('HELLO WORLD');
    expect(stripMarkers('ABCDE12345')).toBe('ABCDE12345');
    expect(typeof stripMarkers({ name: 'NOT A STRING' })).not.toBe('string');
});

test('prependCount', () => {
    expect(prependCount('ABCDE12345')).toBe('\u000aABCDE12345');
});

test('strPack', () => {
    expect(strPack('HELLO WORLD', 4)).toBe('0011HELLO WORLD');
    expect(strPack('ABCDE12345')).toBe('010ABCDE12345');
});

test('buildResponseString', () => {
    expect(buildResponseString()).toBe('\u0000\u0000\u0004');
    expect(buildResponseString('ABCDE12345')).toBe('\u0000\u0000ABCDE12345\u0004');
    expect(buildResponseString(['HELLO', 'WORLD'])).toBe('\u0000\u0000HELLO\r\nWORLD\r\n\u0004');
});
