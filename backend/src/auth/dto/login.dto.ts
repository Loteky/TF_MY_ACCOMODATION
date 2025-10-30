import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  service_number!: string;

  @IsEmail()
  @Matches(/^.+@navy\.mil\.ng$/i)
  official_email!: string;
}
