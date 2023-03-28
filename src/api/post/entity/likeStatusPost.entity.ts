import { getNextStrId } from '@src/utils';
import { LikeStatuses } from '@src/types';

export class LikeStatusPostEntity {
  id: string;
  createdAt: string;
  constructor(
    public userId: string,
    public userLogin: string,
    public likeStatus: LikeStatuses,
  ) {
    this.id = getNextStrId();
    this.createdAt = new Date().toISOString();
  }
}
