import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InterestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterestDto } from './dto/create-interest.dto';

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createInterest(officerId: string, dto: CreateInterestDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listing_id } });
    if (!listing) {
      throw new NotFoundException('Listing not located');
    }
    if (listing.owner_id === officerId) {
      throw new ForbiddenException('You cannot register interest in your own listing');
    }
    return this.prisma.interest.create({
      data: {
        listing_id: dto.listing_id,
        interested_officer_id: officerId,
        message: dto.message,
      },
    });
  }

  async updateStatus(interestId: string, actorId: string, status: InterestStatus) {
    const interest = await this.prisma.interest.findUnique({ where: { id: interestId } });
    if (!interest) {
      throw new NotFoundException('Interest entry missing');
    }
    const listing = await this.prisma.listing.findUnique({ where: { id: interest.listing_id } });
    if (!listing) {
      throw new NotFoundException('Listing not located');
    }
    if (listing.owner_id !== actorId && interest.interested_officer_id !== actorId) {
      throw new ForbiddenException('You cannot alter this interest without being involved');
    }
    return this.prisma.interest.update({
      where: { id: interestId },
      data: { status },
    });
  }

  async listForListing(listingId: string, actor: { id: string; role: string }) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not located');
    }
    if (listing.owner_id !== actor.id && actor.role === 'OFFICER') {
      throw new ForbiddenException('Only the listing owner or command staff may view interests');
    }
    return this.prisma.interest.findMany({
      where: { listing_id: listingId },
      orderBy: { created_at: 'desc' },
    });
  }
}
