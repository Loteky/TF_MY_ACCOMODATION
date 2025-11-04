import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<any> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<any> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<any> {
    // Option A: if your service has refreshTokens(refreshToken: string)
    if ((this.authService as any).refreshTokens) {
      // Common DTO field names: refreshToken OR token
      const token = (dto as any).refreshToken ?? (dto as any).token ?? (dto as any).refresh;
      return (this.authService as any).refreshTokens(token);
    }

    // Option B: if your service already implemented refresh(dto)
    if ((this.authService as any).refresh) {
      return (this.authService as any).refresh(dto);
    }

    // Option C: fallback — surface a clear error if neither exists
    throw new Error('AuthService is missing both refresh() and refreshTokens() methods');
  }
}
