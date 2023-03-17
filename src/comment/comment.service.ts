import { HttpStatus, Injectable } from '@nestjs/common';
import { isEmpty } from 'lodash';
import { validateOrRejectModel } from '../validate';
import { CommentRepository } from './comment.repository';
import { UserRepository } from '../user/user.repository';
import { PostRepository } from '../post/post.repository';
import { LikeStatusRepository } from '../likeStatus/likeStatus.repository';

import { CommentDocument } from './schemas';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { PageType } from '../types';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly likeStatusRepository: LikeStatusRepository,
  ) {}
  // Поис комментария
  async findCommentById(commentId: string): Promise<CommentDocument | null> {
    const foundCommentById = await this.commentRepository.findCommentById(
      commentId,
    );

    return foundCommentById;
  }
  // Обновить комментарий
  async updateComment(
    userId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<{
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    await validateOrRejectModel(updateCommentDto, UpdateCommentDto);

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
            message: `UserId incorrect`,
          },
        ],
      };
    }
    // Проверяем принадлежит ли обновляемый комментарий пользователю
    if (
      foundComment.userId !== foundUser.id ||
      foundComment.userLogin !== foundUser.accountData.login
    ) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        statusMessage: [
          {
            message: `FORBIDDEN`,
          },
        ],
      };
    }
    // Обновляем блогера
    const { content } = updateCommentDto;
    foundComment.updateComment({ content });
    // Сохраняем в базу
    await this.commentRepository.save(foundComment);
    // Возвращаем статус 204
    return {
      statusCode: HttpStatus.NO_CONTENT,
      statusMessage: [
        {
          message: `Comment updated`,
        },
      ],
    };
  }
  // Создание комментария по идентификатору поста
  async createCommentsByPostId(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<{
    commentId: string;
    statusCode: HttpStatus;
    statusMessage: [{ message: string; field?: string }];
  }> {
    await validateOrRejectModel(createCommentDto, CreateCommentDto);

    // Ищем пост для которого создаем комментарий
    const foundPost = await this.postRepository.findPostById(postId);
    // Если пост не найден, возвращаем ошибку 404
    if (isEmpty(foundPost)) {
      return {
        commentId: null,
        statusCode: HttpStatus.NOT_FOUND,
        statusMessage: [
          {
            message: `Post with id ${postId} was not found`,
          },
        ],
      };
    }

    // Ищем пользователя
    const foundUser = await this.userRepository.findUserById(userId);
    // Если пользователь не найден, возвращаем ошибку 400
    if (isEmpty(foundUser)) {
      return {
        commentId: null,
        statusCode: HttpStatus.BAD_REQUEST,
        statusMessage: [
          {
            message: `UserId incorrect`,
          },
        ],
      };
    }

    const { content } = createCommentDto;
    // Создаем документ комментария
    const madeComment = await this.commentRepository.createComment({
      content,
      postId: foundPost.id,
      userId: foundUser.id,
      userLogin: foundUser.accountData.login,
    });
    // Сохраняем пост в базе
    const createdComment = await this.commentRepository.save(madeComment);
    // Возвращаем идентификатор созданного поста и статус 200
    return {
      commentId: createdComment.id,
      statusCode: HttpStatus.CREATED,
      statusMessage: [
        {
          message: `Comment created`,
        },
      ],
    };
  }
  // Удаление комментария
  async deleteCommentById(commentId: string): Promise<boolean> {
    const isDeleteCommentById = await this.commentRepository.deleteCommentById(
      commentId,
    );

    await this.likeStatusRepository.deleteLikeStatusesByParentId(
      commentId,
      PageType.COMMENT,
    );

    return isDeleteCommentById;
  }
}
