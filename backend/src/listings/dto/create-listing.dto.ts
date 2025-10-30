import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { RentCycle } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  base!: string;

  @IsOptional()
  @IsString()
  geo_area?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  rent_amount!: number;

  @IsString()
  @IsNotEmpty()
  rent_currency!: string;

  @IsEnum(RentCycle)
  rent_cycle!: RentCycle;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deposit_amount?: number;

  @IsNumber()
  @IsPositive()
  bedrooms!: number;

  @IsNumber()
  @IsPositive()
  bathrooms!: number;

  @IsBoolean()
  furnished!: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  amenities!: string[];

  @IsString()
  @IsNotEmpty()
  exact_address!: string;

  @IsDateString()
  available_from!: string;

  @IsOptional()
  @IsDateString()
  next_rent_due?: string;

  @IsArray()
  @IsString({ each: true })
  photos!: string[];
}
