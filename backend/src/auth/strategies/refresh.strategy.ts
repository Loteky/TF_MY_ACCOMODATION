import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as argon2 from 'argon2';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    const sessions = await this.prisma.session.findMany({
      where: { user_id: payload.sub },
      orderBy: { created_at: 'desc' },
      take: 10,
    });
    let match = false;
    for (const session of sessions) {
      if (await argon2.verify(session.token_hash, refreshToken)) {
        match = true;
        break;
      }
    }
    if (!match) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    const user = await this.authService.validateUserFromJwt(payload);
    return {
      id: user.id,
      role: user.role,
      official_email: user.official_email,
    };
  }
}
