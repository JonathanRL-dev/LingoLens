/** Guard sebelum konfigurasi/kegiatan destruktif: hanya MySQL dengan nama database *_test. */
export function validateTestDatabaseUrl(
  testUrl: string | undefined,
  developmentUrl: string | undefined,
): string {
  if (!testUrl || !developmentUrl)
    throw new Error('DATABASE_URL_TEST dan DATABASE_URL wajib untuk uji DB');
  const test = new URL(testUrl);
  const development = new URL(developmentUrl);
  if (
    test.protocol !== 'mysql:' ||
    !/^\/[a-zA-Z0-9_]+_test$/.test(test.pathname) ||
    test.pathname === development.pathname
  ) {
    throw new Error('Database uji harus terpisah dan berakhiran _test');
  }
  return testUrl;
}
