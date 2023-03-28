import { IsEnum, IsNotEmpty } from 'class-validator';

import { LikeStatuses } from '@src/types';

export class AddLikeStatusDTO {
  @IsNotEmpty({
    message: 'The likeStatus field is required',
  })
  @IsEnum(LikeStatuses)
  likeStatus: LikeStatuses;
}
