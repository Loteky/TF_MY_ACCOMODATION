import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  listing_id!: string;

  @IsUUID()
  to_officer_id!: string;

  @IsDateString()
  proposed_move_in!: string;

  @IsOptional()
  @IsDateString()
  effective_date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  consent_pdf_url?: string;
}
