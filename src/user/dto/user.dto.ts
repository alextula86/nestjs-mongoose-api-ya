import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty({
    message: 'The login field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(3, {
    message: 'The login field must be at least 3, got $value',
  })
  @MaxLength(10, {
    message: 'The login field must be no more than 10, got $value',
  })
  @Matches(/^[a-zA-Z0-9_-]*$/)
  login: string;

  @IsNotEmpty({
    message: 'The password field is required',
  })
  @Transform(({ value }) => value.trim())
  @MinLength(6, {
    message: 'The password field must be at least 3, got $value',
  })
  @MaxLength(20, {
    message: 'The password field must be no more than 20, got $value',
  })
  password: string;

  @IsNotEmpty({
    message: 'The email field is required',
  })
  @Transform(({ value }) => value.trim())
  @IsEmail()
  email: string;
}
