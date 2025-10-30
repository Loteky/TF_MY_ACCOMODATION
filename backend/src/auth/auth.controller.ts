import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      status: 'success',
      officer: this.sanitiseUser(result.user),
      tokens: result.tokens,
    };
  }

  @Post('verify')
  async verify(@Body() dto: LoginDto) {
    return this.authService.verifyOfficer(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      status: 'success',
      officer: this.sanitiseUser(result.user),
      tokens: result.tokens,
    };
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    const result = await this.authService.refreshToken(dto.refresh_token);
    return {
      status: 'success',
      officer: this.sanitiseUser(result.user),
      tokens: result.tokens,
    };
  }

  private sanitiseUser(user: any) {
    const { service_number_hash, ...rest } = user;
    return rest;
  }
}
