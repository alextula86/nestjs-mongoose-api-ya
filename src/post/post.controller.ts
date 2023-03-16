import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuardBasic, AuthGuardBearer } from '../auth.guard';
import { LikeStatuses, ResponseViewModelDetail } from '../types';

import { PostQueryRepository } from './post.query.repository';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostViewModel, QueryPostModel } from './types';

import { CommentQueryRepository } from '../comment/comment.query.repository';
import { CommentService } from '../comment/comment.service';
import { CreateCommentDto } from '../comment/dto';
import { CommentViewModel, QueryCommentModel } from '../comment/types';

import { LikeStatusService } from '../likeStatus/likeStatus.service';
import { AddLikeStatusDTO } from '../likeStatus/dto';

@Controller('api/posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly postQueryRepository: PostQueryRepository,
    private readonly commentService: CommentService,
    private readonly commentQueryRepository: CommentQueryRepository,
    private readonly likeStatusService: LikeStatusService,
  ) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  // Получение списка постов
  async findAllPosts(
    @Req() request: Request & { userId: string },
    @Query()
    {
      searchNameTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    }: QueryPostModel,
  ): Promise<ResponseViewModelDetail<PostViewModel>> {
    const allPosts = await this.postQueryRepository.findAllPosts(
      request.userId,
      {
        searchNameTerm,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      },
    );

    return allPosts;
  }
  // Получение конкретного поста по его идентификатору
  @Get(':postId')
  @UseGuards(AuthGuardBearer)
  @HttpCode(HttpStatus.OK)
  async findPostById(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
  ): Promise<PostViewModel> {
    // Получаем конкретный пост по его идентификатору
    const foundPost = await this.postQueryRepository.findPostById(
      postId,
      request.userId,
    );
    // Если пост не найден возвращаем ошибку 404
    if (!foundPost) {
      throw new NotFoundException();
    }
    // Возвращаем пост в формате ответа пользователю
    return foundPost;
  }
  // Создание поста
  @Post()
  @UseGuards(AuthGuardBasic)
  @HttpCode(HttpStatus.CREATED)
  async createPost(
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostViewModel> {
    // Создаем пост
    const { postId, statusCode, statusMessage } =
      await this.postService.createPost(createPostDto);
    // Если при создании поста возникли ошибки возращаем статус ошибки
    if (statusCode !== HttpStatus.CREATED) {
      throw new HttpException(statusMessage, statusCode);
    }
    // Порлучаем созданный пост в формате ответа пользователю
    const foundPost = await this.postQueryRepository.findPostById(
      postId,
      LikeStatuses.NONE,
    );
    // Возвращаем созданный пост
    return foundPost;
  }
  // Обновление поста
  @Put(':postId')
  @UseGuards(AuthGuardBasic)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<void> {
    // Обновляем пост
    const { statusCode, statusMessage } = await this.postService.updatePost(
      postId,
      updatePostDto,
    );

    if (statusCode === HttpStatus.FORBIDDEN) {
      throw new ForbiddenException(statusMessage);
    }

    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException(statusMessage);
    }

    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
  // Удаление поста
  @Delete(':postId')
  @UseGuards(AuthGuardBasic)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostById(@Param('postId') postId: string): Promise<boolean> {
    // Удаляем пост
    const isPostDeleted = await this.postService.deletePostById(postId);
    // Если при удалении поста вернулись ошибка возвращаем ее
    if (!isPostDeleted) {
      throw new HttpException('Post is not found', HttpStatus.NOT_FOUND);
    }
    // Иначе возвращаем true
    return isPostDeleted;
  }
  // Получение списка комментариев по идентификатору поста
  @Get(':postId/comments')
  @UseGuards(AuthGuardBearer)
  @HttpCode(HttpStatus.OK)
  // Получение списка постов конкретного блогера
  async findCommentsByPostId(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
    @Query()
    { pageNumber, pageSize, sortBy, sortDirection }: QueryCommentModel,
  ): Promise<ResponseViewModelDetail<CommentViewModel>> {
    // Ищем пост по идентификатору
    const foundPost = await this.postService.findPostById(postId);
    // Если блог не найден возвращаем ошибку
    if (!foundPost) {
      throw new NotFoundException();
    }

    const commentsByPostId =
      await this.commentQueryRepository.findCommentsByPostId(
        postId,
        request.userId,
        {
          pageNumber,
          pageSize,
          sortBy,
          sortDirection,
        },
      );

    return commentsByPostId;
  }
  // Создание комментария
  @Post(':postId/comments')
  @UseGuards(AuthGuardBearer)
  @HttpCode(HttpStatus.CREATED)
  async createCommentsByPostId(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentViewModel> {
    // Создаем пост
    const { commentId, statusCode, statusMessage } =
      await this.commentService.createCommentsByPostId(
        request.userId,
        postId,
        createCommentDto,
      );
    // Если пост для которого создается комментарий не найден
    // Возвращаем статус ошибки 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException(statusMessage);
    }
    // Если при создании комментария возникли ошибки возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }

    // Порлучаем созданный комментарий в формате ответа пользователю
    const foundComment = await this.commentQueryRepository.findCommentById(
      commentId,
      LikeStatuses.NONE,
    );
    // Возвращаем созданный комментарий
    return foundComment;
  }
  // Обновление лайк статуса поста
  @Put(':postId/like-status')
  @UseGuards(AuthGuardBearer)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateCommentLikeStatus(
    @Req() request: Request & { userId: string },
    @Param('postId') postId: string,
    @Body() addLikeStatusDTO: AddLikeStatusDTO,
  ): Promise<void> {
    // Обновляем лайк статус поста
    const { statusCode, statusMessage } =
      await this.likeStatusService.updateLikeStatusOfPost(
        request.userId,
        postId,
        addLikeStatusDTO,
      );

    // Если пост не найден, возращаем статус ошибки 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }

    // Если при обновлении лайк статуса поста возникли ошибки
    // Возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
}
