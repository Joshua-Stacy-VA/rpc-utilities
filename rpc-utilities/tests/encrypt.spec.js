'use strict';

const {
    encrypt,
    decrypt,
} = require('../src/encrypt');

test('encrypt', () => {
    const encrypted = encrypt('ABCDE12345');
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBe(12);

    const encryptedOSEHRA = encrypt('ABCDE12345', 'OSEHRA');
    expect(typeof encryptedOSEHRA).toBe('string');
    expect(encryptedOSEHRA.length).toBe(12);
    expect(encryptedOSEHRA).not.toEqual(encrypted);

    // This defaults to the 'VA' cipher
    const encryptedDefault = encrypt('ABCDE12345', 'UNKNOWN_CIPHER_TYPE');
    expect(typeof encryptedDefault).toBe('string');
    expect(encryptedDefault.length).toBe(12);

    expect(encrypt('')).toBe('');
    expect(encrypt({ name: 'NOT A STRING' })).toBe('');
});

test('decrypt', () => {
    expect(decrypt(null)).toBe('');
    expect(decrypt('AB')).toBe('');
    expect(decrypt({ name: 'NOT A STRING' })).toBe('');

    const decrypted = decrypt('1C;A*WV3H%P%');
    expect(typeof decrypted).toBe('string');
    expect(decrypted.length).toBe(10);
    expect(decrypted).toBe('ABCDE12345');

    const decryptedOSEHRA = decrypt('-tD}~G*4z,i1', 'OSEHRA');
    expect(typeof decryptedOSEHRA).toBe('string');
    expect(decryptedOSEHRA.length).toBe(10);
    expect(decryptedOSEHRA).toBe('ABCDE12345');

    // This defaults to the 'VA' cipher
    const decryptedDefault = decrypt('1C;A*WV3H%P%', 'UNKNOWN_CIPHER_TYPE');
    expect(typeof decryptedDefault).toBe('string');
    expect(decryptedDefault.length).toBe(10);
    expect(decryptedDefault).toBe('ABCDE12345');

    // Badly formatted encryption strings:
    // * Bad start index character
    // * Bad end index character
    // * Out of bounds characters
    expect(decrypt('ZC;A*WV3H%P%')).toBe('');
    expect(decrypt('1C;A*WV3H%PZ')).toBe('');
});
