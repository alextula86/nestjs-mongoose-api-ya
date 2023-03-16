import { HttpStatus, Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { validateOrRejectModel } from '../validate';

import { LikeStatusRepository } from './likeStatus.repository';
import { PostRepository } from '../post/post.repository';
import { CommentRepository } from '../comment/comment.repository';
import { UserRepository } from '../user/user.repository';

import { AddLikeStatusDTO } from './dto/likeStatus.dto';
import { LikeStatuses, PageType } from '../types';

@Injectable()
export class LikeStatusService {
  constructor(
    private readonly likeStatusRepository: LikeStatusRepository,
    private readonly postRepository: PostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository,
  ) {}
  // Получить лайк статус пользователя
  async getLikeStatusOfUser(
    userId: string | null,
    parentId: string,
    pageType: PageType,
  ): Promise<LikeStatuses> {
    if (!userId) {
      return LikeStatuses.NONE;
    }

    const foundLikeStatusOfUser =
      await this.likeStatusRepository.findLikeStatusOfUser(
        userId,
        parentId,
        pageType,
      );

    if (!foundLikeStatusOfUser) {
      return LikeStatuses.NONE;
    }

    return foundLikeStatusOfUser.likeStatus;
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
    foundLikeStatusOfUserComment.updateLikeStatus(likeStatus);
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
  // Обновление лайк статуса поста
  async updateLikeStatusOfPost(
    userId: string,
    postId: string,
    addLikeStatusDTO: AddLikeStatusDTO,
  ): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    await validateOrRejectModel(addLikeStatusDTO, AddLikeStatusDTO);

    // Ищем пост
    const foundPost = await this.postRepository.findPostById(postId);
    // Если пост не найден, возвращаем ошибку 404
    if (isEmpty(foundPost)) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: [
          {
            message: `Comment with id ${postId} was not found`,
            field: 'postId',
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
    // Находим лайк статус поста пользователя
    const foundLikeStatusOfUserPost =
      await this.likeStatusRepository.findLikeStatusOfUser(
        userId,
        postId,
        PageType.POST,
      );
    // Если пользователь не лайкал пост, то создаем инстанс лайк статуса и добавляем его для поста
    if (!foundLikeStatusOfUserPost) {
      const madeLikeStatus = await this.likeStatusRepository.createLikeStatus({
        parentId: postId,
        userId: foundUser.id,
        userLogin: foundUser.accountData.login,
        likeStatus,
        pageType: PageType.POST,
      });
      // Сохраняем созданный лайкстатус в базе
      await this.likeStatusRepository.save(madeLikeStatus);
      // Находим количество лайков поста
      const likesCount = await this.likeStatusRepository.getLikeStatusCount(
        postId,
        PageType.POST,
        LikeStatuses.LIKE,
      );
      // Находим количество дизлайков поста
      const dislikesCount = await this.likeStatusRepository.getLikeStatusCount(
        postId,
        PageType.POST,
        LikeStatuses.DISLIKE,
      );
      // Обновляем количесво лайков и дизлайков поста
      foundPost.updateLikeStatusesCount({ likesCount, dislikesCount });
      // Сохраняем пост в базе
      await this.postRepository.save(foundPost);
      // Возвращаем статус 204

      const alllikes = await this.likeStatusRepository.findLikes();
      const foundPost1 = await this.postRepository.findPostById(postId);
      console.log('юзер НЕ ставил лайк');
      console.log('alllikes', alllikes);
      console.log('foundPost1', foundPost1);
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
    if (foundLikeStatusOfUserPost.likeStatus === likeStatus) {
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
    foundLikeStatusOfUserPost.updateLikeStatus(likeStatus);
    // Сохраняем лайкстатус в базе
    await this.likeStatusRepository.save(foundLikeStatusOfUserPost);
    // Находим количество лайков поста
    const likesCount = await this.likeStatusRepository.getLikeStatusCount(
      postId,
      PageType.POST,
      LikeStatuses.LIKE,
    );
    // Находим количество дизлайков поста
    const dislikesCount = await this.likeStatusRepository.getLikeStatusCount(
      postId,
      PageType.POST,
      LikeStatuses.DISLIKE,
    );
    // Обновляем количесво лайков и дизлайков поста
    foundPost.updateLikeStatusesCount({ likesCount, dislikesCount });
    // Сохраняем комментарий в базе
    await this.postRepository.save(foundPost);
    const alllikes = await this.likeStatusRepository.findLikes();
    const foundPost1 = await this.postRepository.findPostById(postId);
    console.log('юзер УЖЕ ставил лайк');
    console.log('alllikes', alllikes);
    console.log('foundPost1', foundPost1);
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
