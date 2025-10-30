export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/nhh',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '900s',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  google: {
    keyFile: process.env.GOOGLE_DRIVE_KEY_FILE ?? '',
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ?? '',
    signedUrlSecret: process.env.GOOGLE_SIGNED_URL_SECRET ?? 'signed-secret',
  },
  security: {
    webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  },
  encryptionKey: process.env.DATA_ENCRYPTION_KEY ?? 'change-this-key',
});
