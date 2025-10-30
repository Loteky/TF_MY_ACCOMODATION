import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TransferStatus } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ConfigService } from '@nestjs/config';
import { decrypt, encrypt } from '../common/utils/encryption';

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createTransfer(actor: { id: string; role: string }, dto: CreateTransferDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listing_id } });
    if (!listing) {
      throw new NotFoundException('Listing not located');
    }
    if (listing.owner_id !== actor.id && actor.role === 'OFFICER') {
      throw new ForbiddenException('Only the listing owner or command staff may initiate a transfer');
    }
    const toOfficer = await this.prisma.user.findUnique({ where: { id: dto.to_officer_id } });
    if (!toOfficer) {
      throw new NotFoundException('Receiving officer not located');
    }
    const record = await this.prisma.transfer.create({
      data: {
        listing_id: dto.listing_id,
        from_officer_id: listing.owner_id,
        to_officer_id: dto.to_officer_id,
        proposed_move_in: dayjs(dto.proposed_move_in).toDate(),
        effective_date: dto.effective_date ? dayjs(dto.effective_date).toDate() : null,
        consent_pdf_url: dto.consent_pdf_url
          ? encrypt(dto.consent_pdf_url, this.configService.get<string>('encryptionKey') ?? '')
          : null,
      },
    });
    return this.maskSensitive(record);
  }

  async updateStatus(
    actor: { id: string; role: string },
    transferId: string,
    status: TransferStatus,
    consent_pdf_url?: string,
  ) {
    const transfer = await this.prisma.transfer.findUnique({ where: { id: transferId } });
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }
    const allowedActors = [transfer.from_officer_id, transfer.to_officer_id];
    const isCommand = actor.role === 'ADMIN' || actor.role === 'MODERATOR';
    if (!isCommand && !allowedActors.includes(actor.id)) {
      throw new ForbiddenException('You lack the clearance to update this transfer');
    }
    const updated = await this.prisma.transfer.update({
      where: { id: transferId },
      data: {
        status,
        consent_pdf_url: consent_pdf_url
          ? encrypt(consent_pdf_url, this.configService.get<string>('encryptionKey') ?? '')
          : transfer.consent_pdf_url,
      },
    });
    return this.maskSensitive(updated);
  }

  async listForListing(actor: { id: string; role: string }, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not located');
    }
    const isCommand = actor.role === 'ADMIN' || actor.role === 'MODERATOR';
    if (!isCommand && listing.owner_id !== actor.id) {
      throw new ForbiddenException('You cannot view transfers without command authority');
    }
    const records = await this.prisma.transfer.findMany({
      where: { listing_id: listingId },
      orderBy: { created_at: 'desc' },
    });
    return records.map((record) => this.maskSensitive(record));
  }

  private maskSensitive(record: any) {
    if (record.consent_pdf_url) {
      try {
        record.consent_pdf_url = decrypt(
          record.consent_pdf_url,
          this.configService.get<string>('encryptionKey') ?? '',
        );
      } catch (error) {
        record.consent_pdf_url = 'UNAVAILABLE - DECRYPTION FAILED';
      }
    }
    return record;
  }
}
