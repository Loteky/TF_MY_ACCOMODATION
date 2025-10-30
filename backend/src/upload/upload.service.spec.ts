import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'google.signedUrlSecret') {
        return 'test-secret';
      }
      return undefined;
    }),
  } as unknown as ConfigService;

  const service = new UploadService(configService);

  beforeAll(() => {
    process.env.GOOGLE_DRIVE_MOCK = 'true';
  });

  afterAll(async () => {
    await fs.promises.rm(path.join(process.cwd(), 'storage'), { recursive: true, force: true });
    delete process.env.GOOGLE_DRIVE_MOCK;
  });

  it('stores file locally when mocking', async () => {
    const file = {
      originalname: 'test.png',
      buffer: Buffer.from('fake image'),
      mimetype: 'image/png',
    } as Express.Multer.File;

    const result = await service.uploadImage(file);
    expect(result.google_drive_link).toContain('mock://');
    const storagePath = path.join(process.cwd(), 'storage', 'uploads');
    const files = await fs.promises.readdir(storagePath);
    expect(files.length).toBeGreaterThan(0);
  });
});
