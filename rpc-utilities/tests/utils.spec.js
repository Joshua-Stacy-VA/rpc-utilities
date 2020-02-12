'use strict';

const {
    removeLeftPad,
    unLPack,
    unSPack,
    popSPack,
    popLPack,
} = require('../src/utils');

test('removeLeftPad', () => {
    expect(removeLeftPad('0000ABCDE')).toBe('ABCDE');
    expect(removeLeftPad('ABCDE')).toBe('ABCDE');
    expect(removeLeftPad({ name: 'This is not a string' })).toBeNull();
});

test('unLPack', () => {
    expect(unLPack('005ABCDE', 3)).toEqual(expect.objectContaining({
        string: 'ABCDE',
        width: 3,
    }));
    expect(unLPack('0005ABCDE')).toEqual(expect.objectContaining({
        string: 'ABCDE',
        width: 4,
    }));
    expect(unLPack('010ABCDE')).toBeNull();
    expect(unLPack('005ABCDE', 2)).toBeNull();
    expect(unLPack('005ABCDE', 'NOT A NUMBER!!')).toEqual(expect.objectContaining({
        string: 'ABCDE',
        width: 3,
    }));
    expect(unLPack({ name: 'This is not a string' })).toBeNull();
});

test('unSPack', () => {
    expect(unSPack('\u0005ABCDE')).toBe('ABCDE');
    expect(unSPack('\u0010ABCDE')).toBeNull();
    expect(unSPack({ name: 'This is not a string' })).toBeNull();
});

test('popSPack', () => {
    expect(popSPack('\u0005ABCDE')).toEqual(expect.objectContaining({
        string: 'ABCDE',
        remainder: null,
    }));
    expect(popSPack('\u0005ABCDEFGHIJ')).toEqual(expect.objectContaining({
        string: 'ABCDE',
        remainder: 'FGHIJ',
    }));
    expect(popSPack('\u000FABCDE')).toEqual(expect.objectContaining({
        string: 'ABCDE',
        remainder: null,
    }));
    expect(popSPack({ name: 'This is not a string' })).toBeNull();
});

test('popLPack', () => {
    expect(popLPack('005ABCDE', 3)).toEqual(expect.objectContaining({
        string: 'ABCDE',
        remainder: '',
    }));
    expect(popLPack('000ABCDE', 3)).toEqual(expect.objectContaining({
        string: '',
        remainder: 'ABCDE',
    }));
    expect(popLPack({ name: 'This is not a string' })).toBeNull();
    expect(popLPack('005ABCDE', 'NOT A NUMBER!!')).toBeNull();
    expect(popLPack('005ABCDE', null)).toBeNull();
});
