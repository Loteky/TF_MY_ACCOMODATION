import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { UpdateInterestStatusDto } from './dto/update-interest-status.dto';

@Controller('interests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Post()
  @Roles('OFFICER', 'MODERATOR', 'ADMIN')
  async create(@Req() req: any, @Body() dto: CreateInterestDto) {
    return this.interestsService.createInterest(req.user.id, dto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateInterestStatusDto) {
    return this.interestsService.updateStatus(id, req.user.id, dto.status);
  }

  @Get('listing/:listingId')
  async listForListing(@Param('listingId') listingId: string, @Req() req: any) {
    return this.interestsService.listForListing(listingId, req.user);
  }
}
