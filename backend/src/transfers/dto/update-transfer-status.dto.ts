import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransferStatus } from '@prisma/client';

export class UpdateTransferStatusDto {
  @IsEnum(TransferStatus)
  status!: TransferStatus;

  @IsOptional()
  @IsString()
  consent_pdf_url?: string;
}
