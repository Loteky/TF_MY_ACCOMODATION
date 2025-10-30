import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createContext = (user: any, roles?: string[]): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => null,
      getClass: () => null,
    } as unknown as ExecutionContext;
  };

  it('allows access when no roles specified', () => {
    const context = createContext({ role: 'OFFICER' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies access when role missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const context = createContext({ role: 'OFFICER' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows access when role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['OFFICER']);
    const context = createContext({ role: 'OFFICER' });
    expect(guard.canActivate(context)).toBe(true);
  });
});
