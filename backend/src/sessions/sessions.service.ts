import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(params: {
    userId: string;
    tokenHash: string;
    expiresInSeconds: number;
    ip?: string;
    ua?: string;
  }) {
    const expiresAt = dayjs().add(params.expiresInSeconds, 'second').toDate();
    return this.prisma.session.create({
      data: {
        user_id: params.userId,
        token_hash: params.tokenHash,
        expires_at: expiresAt,
        ip: params.ip,
        ua: params.ua,
      },
    });
  }

  async removeSessionById(id: string) {
    try {
      await this.prisma.session.delete({ where: { id } });
    } catch (error) {
      // session already removed; ignore
    }
  }

  async purgeExpiredSessions() {
    await this.prisma.session.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }

  async findValidSession(userId: string, refreshToken: string) {
    const sessions = await this.prisma.session.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    for (const session of sessions) {
      const match = await argon2.verify(session.token_hash, refreshToken).catch(() => false);
      if (match) {
        return session.id;
      }
    }
    return null;
  }
}
