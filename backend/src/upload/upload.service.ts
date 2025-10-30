import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  private signUrl(url: string) {
    const secret = this.configService.get<string>('google.signedUrlSecret') ?? 'signed-secret';
    const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${url}|${expiresAt}`)
      .digest('hex');
    return `${url}?exp=${expiresAt}&sig=${signature}`;
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }
    const keyFile = this.configService.get<string>('google.keyFile');
    const folderId = this.configService.get<string>('google.folderId');
    const useMock = process.env.GOOGLE_DRIVE_MOCK === 'true';
    if (useMock || !keyFile || !folderId || !fs.existsSync(keyFile)) {
      const uploadsDir = path.join(process.cwd(), 'storage', 'uploads');
      await fs.promises.mkdir(uploadsDir, { recursive: true });
      const filename = `${uuid()}-${file.originalname}`;
      await fs.promises.writeFile(path.join(uploadsDir, filename), file.buffer);
      const url = this.signUrl(`mock://storage/uploads/${filename}`);
      return { status: 'mocked', google_drive_link: url };
    }

    try {
      const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      const drive = google.drive({ version: 'v3', auth });
      const fileName = `${uuid()}-${file.originalname}`;
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: file.mimetype,
        },
        media: {
          mimeType: file.mimetype,
          body: Readable.from(file.buffer),
        },
        fields: 'id',
      });
      const fileId = response.data.id;
      if (!fileId) {
        throw new InternalServerErrorException('Failed to obtain file identifier from Google Drive');
      }
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      const url = this.signUrl(`https://drive.google.com/uc?id=${fileId}`);
      return { status: 'success', google_drive_link: url };
    } catch (error) {
      throw new InternalServerErrorException('Google Drive upload failed');
    }
  }
}
