import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  service_number!: string;

  @IsEmail()
  @Matches(/^.+@navy\.mil\.ng$/i, {
    message: 'Official e-mail must belong to the navy.mil.ng domain',
  })
  official_email!: string;

  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @IsString()
  @IsNotEmpty()
  rank!: string;

  @IsString()
  @IsNotEmpty()
  station!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
