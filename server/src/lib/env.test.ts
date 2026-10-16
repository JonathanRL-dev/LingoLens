// Root Vitest tidak membaca konfigurasi workspace; muat setup juga untuk suite root.
import '../test/setup';
import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const valid = {
  DATABASE_URL: 'mysql://test:test@localhost:3306/lingolens_test',
  JWT_SECRET: 'TEST_ONLY_secret_012345678901234567890123456',
  CORS_ORIGIN: 'http://localhost:5173',
  PORT: '3000',
  NODE_ENV: 'test',
  DEMO_RESET_KEY: 'TEST_ONLY_reset_0123456789',
};
describe('loadEnv', () => {
  it('menerima env valid tanpa default dan tanpa memutasi source', () => {
    const source = Object.freeze({ ...valid });
    expect(loadEnv(source)).toEqual({ ...valid, PORT: 3000, CORS_ORIGIN: [valid.CORS_ORIGIN] });
    expect(source).toEqual(valid);
  });
  it('env kosong menyebut keenam variabel', () => {
    let message = '';
    try {
      loadEnv({});
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      message = error.message;
    }
    for (const key of Object.keys(valid)) expect(message).toContain(key);
  });
  it.each(Object.keys(valid))('menolak variabel hilang: %s', (key) => {
    const source: NodeJS.ProcessEnv = { ...valid };
    delete source[key];
    expect(() => loadEnv(source)).toThrow(key);
  });
  it('menolak secret pendek tanpa membocorkan nilainya', () => {
    const secret = 'secret-pendek';
    expect(() => loadEnv({ ...valid, JWT_SECRET: secret })).toThrow('JWT_SECRET');
    expect(() => loadEnv({ ...valid, JWT_SECRET: secret })).not.toThrow(secret);
  });
  it('menolak placeholder ganti- hanya di production', () => {
    const source = { ...valid, JWT_SECRET: 'ganti-' + 'x'.repeat(32) };
    expect(() => loadEnv(source)).not.toThrow();
    expect(() => loadEnv({ ...source, NODE_ENV: 'production' })).toThrow('JWT_SECRET');
  });
  it('memecah dan memangkas dua origin', () => {
    expect(
      loadEnv({ ...valid, CORS_ORIGIN: 'http://localhost:5173, https://example.com ' }).CORS_ORIGIN,
    ).toEqual(['http://localhost:5173', 'https://example.com']);
  });
  it.each(['', 'not-a-url', 'http://localhost:5173,'])('menolak origin invalid: %j', (origin) => {
    expect(() => loadEnv({ ...valid, CORS_ORIGIN: origin })).toThrow('CORS_ORIGIN');
  });
  it.each(['abc', '', '0', '65536', '1.5'])('menolak PORT=%j', (port) => {
    expect(() => loadEnv({ ...valid, PORT: port })).toThrow('PORT');
  });
  it('menolak protokol database, mode, dan reset key invalid tanpa nilainya', () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: 'postgresql://private' })).toThrow(
      'DATABASE_URL',
    );
    expect(() => loadEnv({ ...valid, NODE_ENV: 'other' })).toThrow('NODE_ENV');
    expect(() => loadEnv({ ...valid, DEMO_RESET_KEY: 'short' })).toThrow('DEMO_RESET_KEY');
  });
});
