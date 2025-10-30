import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus, Listing } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createListing(ownerId: string, dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        owner_id: ownerId,
        title: dto.title,
        city: dto.city,
        state: dto.state,
        base: dto.base,
        geo_area: dto.geo_area,
        rent_amount: dto.rent_amount,
        rent_currency: dto.rent_currency,
        rent_cycle: dto.rent_cycle,
        deposit_amount: dto.deposit_amount,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        furnished: dto.furnished,
        amenities: dto.amenities,
        exact_address_enc: Buffer.from(dto.exact_address, 'utf-8').toString('base64'),
        available_from: dayjs(dto.available_from).toDate(),
        next_rent_due: dto.next_rent_due ? dayjs(dto.next_rent_due).toDate() : null,
        photos: dto.photos,
        status: 'draft',
      },
    });
  }

  async assertOwner(listingId: string, officerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.owner_id !== officerId) {
      throw new ForbiddenException('You do not control this property listing');
    }
    return listing;
  }

  async updateStatus(listingId: string, officerId: string, status: ListingStatus) {
    await this.assertOwner(listingId, officerId);
    return this.prisma.listing.update({
      where: { id: listingId },
      data: { status },
    });
  }

  async listForViewer(viewer?: { id: string; role: string }) {
    const listings = await this.prisma.listing.findMany({
      orderBy: { created_at: 'desc' },
    });
    return listings.map((listing) => this.redactListing(listing, viewer));
  }

  async getListing(id: string, viewer?: { id: string; role: string }) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return this.redactListing(listing, viewer);
  }

  redactListing(listing: Listing, viewer?: { id: string; role: string }) {
    const canViewAddress =
      viewer && (viewer.role === 'ADMIN' || viewer.role === 'MODERATOR' || listing.owner_id === viewer.id);
    const { exact_address_enc, ...rest } = listing;
    return {
      ...rest,
      rent_amount: Number(rest.rent_amount),
      deposit_amount: rest.deposit_amount ? Number(rest.deposit_amount) : null,
      exact_address: canViewAddress
        ? Buffer.from(exact_address_enc, 'base64').toString('utf-8')
        : 'REDACTED - Contact the moderator for access',
    };
  }
}
