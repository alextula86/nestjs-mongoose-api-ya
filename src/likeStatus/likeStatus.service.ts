import { HttpStatus, Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { validateOrRejectModel } from '../validate';
import { CommentRepository } from '../comment/comment.repository';
import { UserRepository } from '../user/user.repository';
import { LikeStatusRepository } from './likeStatus.repository';

import { AddLikeStatusDTO } from './dto/likeStatus.dto';
import { LikeStatuses, PageType } from '../types';
import { LikeStatusDocument } from './schemas';

@Injectable()
export class LikeStatusService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository,
    private readonly likeStatusRepository: LikeStatusRepository,
  ) {}
  // Получить лайк статус пользователя
  async getLikeStatusOfUserComment(
    userId: string | null,
    commentId: string,
  ): Promise<LikeStatuses> {
    if (!userId) {
      return LikeStatuses.NONE;
    }

    const foundLikeStatusOfUserComment =
      await this.likeStatusRepository.findLikeStatusOfUser(
        userId,
        commentId,
        PageType.COMMENT,
      );

    if (!foundLikeStatusOfUserComment) {
      return LikeStatuses.NONE;
    }

    return foundLikeStatusOfUserComment.likeStatus;
  }
  // Поиск всех лайк статусов комментарий пользователя
  async getLikeStatusesOfUserComment(
    userId: string,
  ): Promise<LikeStatusDocument[]> {
    const foundLikeStatuses =
      await this.likeStatusRepository.findLikeStatusesOfUser(
        userId,
        PageType.COMMENT,
      );

    return foundLikeStatuses;
  }
  // Обновление лайк статуса коментария
  async updateLikeStatusOfComment(
    userId: string,
    commentId: string,
    addLikeStatusDTO: AddLikeStatusDTO,
  ): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    await validateOrRejectModel(addLikeStatusDTO, AddLikeStatusDTO);

    // Ищем комментарий
    const foundComment = await this.commentRepository.findCommentById(
      commentId,
    );
    // Если комментарий не найден, возвращаем ошибку 404
    if (isEmpty(foundComment)) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: [
          {
            message: `Comment with id ${commentId} was not found`,
            field: 'commentId',
          },
        ],
      };
    }
    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 400
    if (isEmpty(foundUser)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: `User with id ${userId} was not found`,
            field: 'userId',
          },
        ],
      };
    }
    // Получаем лайк статус из DTO
    const { likeStatus } = addLikeStatusDTO;
    // Находим лайк статус коментария пользователя
    const foundLikeStatusOfUserComment =
      await this.likeStatusRepository.findLikeStatusOfUser(
        userId,
        commentId,
        PageType.COMMENT,
      );
    // Если пользователь не лайкал комментарий, то создаем инстанс лайк статуса и добавляем его для комментария
    if (!foundLikeStatusOfUserComment) {
      const madeLikeStatus = await this.likeStatusRepository.createLikeStatus({
        parentId: commentId,
        userId: foundUser.id,
        userLogin: foundUser.accountData.login,
        likeStatus,
        pageType: PageType.COMMENT,
      });
      // Сохраняем созданный лайкстатус в базе
      await this.likeStatusRepository.save(madeLikeStatus);
      // Находим количество лайков комментария
      const likesCount = await this.likeStatusRepository.getLikeStatusCount(
        commentId,
        PageType.COMMENT,
        LikeStatuses.LIKE,
      );
      // Находим количество дизлайков комментария
      const dislikesCount = await this.likeStatusRepository.getLikeStatusCount(
        commentId,
        PageType.COMMENT,
        LikeStatuses.DISLIKE,
      );
      // Обновляем количесво лайков и дизлайков комментария
      foundComment.updateLikeStatusesCount({ likesCount, dislikesCount });
      // Сохраняем комментарий в базе
      await this.commentRepository.save(foundComment);
      // Возвращаем статус 204
      return {
        statusCode: HttpStatus.NO_CONTENT,
        statusMessage: [
          {
            message: `Like status update`,
          },
        ],
      };
    }
    // Если лайк статус пользователя равен переданому лайк статусу не производим обновление лайк статуса
    if (foundLikeStatusOfUserComment.likeStatus === likeStatus) {
      return {
        statusCode: HttpStatus.NO_CONTENT,
        statusMessage: [
          {
            message: `Like status update`,
          },
        ],
      };
    }
    // Обновляем лайк статус
    foundLikeStatusOfUserComment.updateLikeStatus(addLikeStatusDTO.likeStatus);
    // Сохраняем лайкстатус в базе
    await this.likeStatusRepository.save(foundLikeStatusOfUserComment);
    // Находим количество лайков комментария
    const likesCount = await this.likeStatusRepository.getLikeStatusCount(
      commentId,
      PageType.COMMENT,
      LikeStatuses.LIKE,
    );
    // Находим количество дизлайков комментария
    const dislikesCount = await this.likeStatusRepository.getLikeStatusCount(
      commentId,
      PageType.COMMENT,
      LikeStatuses.DISLIKE,
    );
    // Обновляем количесво лайков и дизлайков комментария
    foundComment.updateLikeStatusesCount({ likesCount, dislikesCount });
    // Сохраняем комментарий в базе
    await this.commentRepository.save(foundComment);
    // Возвращаем статус 204
    return {
      statusCode: HttpStatus.NO_CONTENT,
      statusMessage: [
        {
          message: `Like status update`,
        },
      ],
    };
  }
}
