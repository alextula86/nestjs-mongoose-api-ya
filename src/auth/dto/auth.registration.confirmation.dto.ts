import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistrationConfirmationDto {
  @IsNotEmpty({
    message: 'The code field is required',
  })
  @IsString({
    message: 'recoveryCodeError is incorrectly',
  })
  @Transform(({ value }) => value.trim())
  @IsUUID('all', {
    message: 'code is incorrectly',
  })
  code: string;
}
