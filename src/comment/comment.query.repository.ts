import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isEmpty } from 'lodash';
import { LikeStatuses, ResponseViewModelDetail, SortDirection } from '../types';
import { Comment, CommentDocument, CommentModelType } from './schemas';
import {
  LikeStatus,
  LikeStatusDocument,
  LikeStatusModelType,
} from '../likeStatus/schemas';
import { CommentViewModel, QueryCommentModel } from './types';

@Injectable()
export class CommentQueryRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    @InjectModel(LikeStatus.name) private LikeStatusModel: LikeStatusModelType,
  ) {}
  async findCommentsByPostId(
    postId: string,
    likeStatuses: LikeStatusDocument[],
    { pageNumber, pageSize, sortBy, sortDirection }: QueryCommentModel,
  ): Promise<ResponseViewModelDetail<CommentViewModel>> {
    const number = pageNumber ? Number(pageNumber) : 1;
    const size = pageSize ? Number(pageSize) : 10;

    const filter: any = { postId: { $eq: postId } };
    const sort: any = {
      [sortBy]: sortDirection === SortDirection.ASC ? 1 : -1,
    };

    const totalCount = await this.CommentModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / size);
    const skip = (number - 1) * size;

    const comments = await this.CommentModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(size);

    return this._getCommentsViewModelDetail(
      {
        items: comments,
        totalCount,
        pagesCount,
        page: number,
        pageSize: size,
      },
      likeStatuses,
    );
  }
  async findCommentById(
    commentId: string,
    likeStatusUser: LikeStatuses,
  ): Promise<CommentViewModel | null> {
    const foundComment = await this.CommentModel.findOne({ id: commentId });

    if (!foundComment) {
      return null;
    }

    return this._getCommentViewModel(foundComment, likeStatusUser);
  }
  _getCommentViewModel(
    commentDocument: CommentDocument,
    likeStatusUser: LikeStatuses,
  ): CommentViewModel {
    return {
      id: commentDocument.id,
      content: commentDocument.content,
      commentatorInfo: {
        userId: commentDocument.userId,
        userLogin: commentDocument.userLogin,
      },
      createdAt: commentDocument.createdAt,
      likesInfo: {
        likesCount: commentDocument.likesCount,
        dislikesCount: commentDocument.dislikesCount,
        myStatus: likeStatusUser,
      },
    };
  }
  _getCommentsViewModelDetail(
    {
      items,
      totalCount,
      pagesCount,
      page,
      pageSize,
    }: ResponseViewModelDetail<CommentDocument>,
    likeStatuses: LikeStatusDocument[],
  ): ResponseViewModelDetail<CommentViewModel> {
    return {
      pagesCount,
      page,
      pageSize,
      totalCount,
      items: items.map((item) => {
        const likeStatusResult = !isEmpty(likeStatuses)
          ? likeStatuses.find((status) => status.parentId === item.id)
          : undefined;

        return {
          id: item.id,
          content: item.content,
          commentatorInfo: {
            userId: item.userId,
            userLogin: item.userLogin,
          },
          createdAt: item.createdAt,
          likesInfo: {
            likesCount: item.likesCount,
            dislikesCount: item.dislikesCount,
            myStatus: likeStatusResult
              ? likeStatusResult.likeStatus
              : LikeStatuses.NONE,
          },
        };
      }),
    };
  }
}
