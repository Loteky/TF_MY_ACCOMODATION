import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return this.sanitise(user);
  }

  @Get()
  @Roles('ADMIN', 'MODERATOR')
  async list() {
    const users = await this.usersService.listUsers();
    return users.map((user) => this.sanitise(user));
  }

  private sanitise(user: any) {
    const { service_number_hash, ...rest } = user;
    return rest;
  }
}
