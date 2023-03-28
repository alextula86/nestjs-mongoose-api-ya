import { LikeStatuses } from '@src/types';

export type CreateLikeStatusPostModel = {
  userId: string;
  userLogin: string;
  likeStatus: LikeStatuses;
};
