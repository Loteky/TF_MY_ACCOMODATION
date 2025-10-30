import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';

@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @Roles('OFFICER', 'MODERATOR', 'ADMIN')
  async create(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.transfersService.createTransfer(req.user, dto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateTransferStatusDto) {
    return this.transfersService.updateStatus(req.user, id, dto.status, dto.consent_pdf_url);
  }

  @Get('listing/:listingId')
  async list(@Param('listingId') listingId: string, @Req() req: any) {
    return this.transfersService.listForListing(req.user, listingId);
  }
}
