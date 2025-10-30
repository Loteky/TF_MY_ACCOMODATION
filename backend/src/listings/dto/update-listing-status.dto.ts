import { IsEnum } from 'class-validator';
import { ListingStatus } from '@prisma/client';

export class UpdateListingStatusDto {
  @IsEnum(ListingStatus)
  status!: ListingStatus;
}
