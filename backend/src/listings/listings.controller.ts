import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';

@Controller('listings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @Roles('OFFICER', 'MODERATOR', 'ADMIN')
  async create(@Req() req: any, @Body() dto: CreateListingDto) {
    const listing = await this.listingsService.createListing(req.user.id, dto);
    return this.listingsService.redactListing(listing, req.user);
  }

  @Get()
  async list(@Req() req: any) {
    return this.listingsService.listForViewer(req.user);
  }

  @Get(':id')
  async get(@Param('id') id: string, @Req() req: any) {
    return this.listingsService.getListing(id, req.user);
  }

  @Patch(':id/status')
  @Roles('OFFICER', 'MODERATOR', 'ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateListingStatusDto,
  ) {
    const listing = await this.listingsService.updateStatus(id, req.user.id, dto.status);
    return this.listingsService.redactListing(listing, req.user);
  }
}
