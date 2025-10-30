import { IsEnum } from 'class-validator';
import { InterestStatus } from '@prisma/client';

export class UpdateInterestStatusDto {
  @IsEnum(InterestStatus)
  status!: InterestStatus;
}
