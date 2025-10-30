import { decrypt, encrypt } from './encryption';

describe('encryption utility', () => {
  it('round-trips plaintext with provided secret', () => {
    const secret = 'test-secret';
    const payload = 'confidential-data';
    const cipher = encrypt(payload, secret);
    expect(cipher).not.toEqual(payload);
    expect(decrypt(cipher, secret)).toEqual(payload);
  });

  it('fails with incorrect secret', () => {
    const cipher = encrypt('data', 'secret-one');
    expect(() => decrypt(cipher, 'secret-two')).toThrow();
  });
});
