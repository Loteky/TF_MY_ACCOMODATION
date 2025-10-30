import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyDto {
  @IsString()
  @IsNotEmpty()
  service_number!: string;

  @IsEmail()
  @Matches(/^.+@navy\.mil\.ng$/i)
  official_email!: string;
}
