import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { durationToSeconds } from '../common/utils/time';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

@Injectable()
export class AuthService {
  private readonly accessExpiresInSeconds: number;
  private readonly refreshExpiresInSeconds: number;
  private readonly refreshSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessExpiresInSeconds = durationToSeconds(
      this.configService.get<string>('jwt.accessExpiresIn') ?? '900s',
    );
    this.refreshExpiresInSeconds = durationToSeconds(
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
    );
    this.refreshSecret = this.configService.get<string>('jwt.refreshSecret') ?? 'refresh-secret';
  }

  private async generateTokens(user: User): Promise<TokenResponse> {
    const payload = {
      sub: user.id,
      role: user.role,
      official_email: user.official_email,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
    });
    await this.sessionsService.createSession({
      userId: user.id,
      tokenHash: await argon2.hash(refreshToken),
      expiresInSeconds: this.refreshExpiresInSeconds,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.accessExpiresInSeconds,
      refresh_expires_in: this.refreshExpiresInSeconds,
    };
  }

  async register(registerDto: RegisterDto) {
    const officialEmail = registerDto.official_email.toLowerCase();
    const existing = await this.usersService.findByOfficialEmail(officialEmail);
    if (existing) {
      throw new BadRequestException('An officer already exists with this official e-mail');
    }
    const serviceNumberHash = await argon2.hash(registerDto.service_number);
    const user = await this.usersService.createUser({
      service_number_hash: serviceNumberHash,
      official_email: officialEmail,
      full_name: registerDto.full_name,
      rank: registerDto.rank,
      station: registerDto.station,
      phone: registerDto.phone,
    });
    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByOfficialEmail(loginDto.official_email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const match = await argon2.verify(user.service_number_hash, loginDto.service_number);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.generateTokens(user);
    return { user, tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret,
      });
      const user = await this.usersService.findById(payload.sub);
      const sessionId = await this.sessionsService.findValidSession(user.id, refreshToken);
      if (!sessionId) {
        throw new UnauthorizedException('Refresh token revoked');
      }
      await this.sessionsService.removeSessionById(sessionId);
      const tokens = await this.generateTokens(user);
      return { user, tokens };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyOfficer(dto: LoginDto) {
    const user = await this.usersService.findByOfficialEmail(dto.official_email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Unable to verify officer');
    }
    const match = await argon2.verify(user.service_number_hash, dto.service_number);
    if (!match) {
      throw new UnauthorizedException('Unable to verify officer');
    }
    return { status: 'verified', officer_id: user.id };
  }

  async validateUserFromJwt(payload: { sub: string; role: Role }) {
    return this.usersService.findById(payload.sub);
  }
}
