import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeStatusRepository } from './likeStatus.repository';
import { LikeStatus, LikeStatusSchema } from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LikeStatus.name, schema: LikeStatusSchema },
    ]),
  ],
  providers: [LikeStatusRepository],
})
export class CommentModule {}
