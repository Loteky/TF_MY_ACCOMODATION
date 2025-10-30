import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';

describe('AuthService', () => {
  const usersService = {
    findByOfficialEmail: jest.fn(),
    createUser: jest.fn(),
    findById: jest.fn(),
  } as unknown as UsersService;
  const sessionsService = {
    createSession: jest.fn(),
    findValidSession: jest.fn().mockResolvedValue('session-1'),
    removeSessionById: jest.fn(),
  } as unknown as SessionsService;
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('token'),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'jwt.accessExpiresIn': '900s',
        'jwt.refreshExpiresIn': '7d',
        'jwt.refreshSecret': 'refresh-secret',
      };
      return map[key];
    }),
  } as unknown as ConfigService;

  const service = new AuthService(usersService, sessionsService, jwtService, configService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user with hashed service number', async () => {
    (usersService.findByOfficialEmail as jest.Mock).mockResolvedValue(null);
    (usersService.createUser as jest.Mock).mockImplementation(async (data) => ({
      id: 'user-1',
      role: 'OFFICER',
      official_email: data.official_email,
      full_name: data.full_name,
      service_number_hash: data.service_number_hash,
    }));

    const result = await service.register({
      service_number: 'ABC123',
      official_email: 'test@navy.mil.ng',
      full_name: 'Test Officer',
      rank: 'Lieutenant',
      station: 'Naval Base',
    });

    expect(usersService.createUser).toHaveBeenCalled();
    const callArg = (usersService.createUser as jest.Mock).mock.calls[0][0];
    expect(callArg.service_number_hash).not.toBe('ABC123');
    expect(result.tokens.access_token).toBeDefined();
  });

  it('verifies officer credentials', async () => {
    const hash = await argon2.hash('ABC123');
    (usersService.findByOfficialEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'OFFICER',
      service_number_hash: hash,
      official_email: 'test@navy.mil.ng',
    });
    const verify = await service.verifyOfficer({
      service_number: 'ABC123',
      official_email: 'test@navy.mil.ng',
    });
    expect(verify.status).toBe('verified');
  });
});
