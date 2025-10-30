import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateInterestDto {
  @IsUUID()
  listing_id!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
