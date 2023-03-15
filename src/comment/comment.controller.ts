import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuardBearer } from '../auth.guard';
import { CommentQueryRepository } from './comment.query.repository';
import { CommentService } from './comment.service';
import { LikeStatusService } from '../likeStatus/likeStatus.service';
import { UpdateCommentDto } from './dto';
import { AddLikeStatusDTO } from '../likeStatus/dto';
import { CommentViewModel } from './types';

@UseGuards(AuthGuardBearer)
@Controller('api/comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly commentQueryRepository: CommentQueryRepository,
    private readonly likeStatusService: LikeStatusService,
  ) {}
  // Получение конкретного комментария по его идентификатору
  @Get(':commentId')
  @HttpCode(HttpStatus.OK)
  async findCommentById(
    @Req() request: Request & { userId: string },
    @Param('commentId') commentId: string,
  ): Promise<CommentViewModel> {
    const likeStatusUser =
      await this.likeStatusService.getLikeStatusOfUserComment(
        request.userId,
        commentId,
      );
    // Получаем комментарий по идентификатору
    const foundComment = await this.commentQueryRepository.findCommentById(
      commentId,
      likeStatusUser,
    );
    // Если комментарий не найден возвращаем ошибку
    if (!foundComment) {
      throw new HttpException('Comment is not found', HttpStatus.NOT_FOUND);
    }
    // Возвращаем комментарий в формате ответа пользователю
    return foundComment;
  }
  // Обновление комментария
  @Put(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Req() request: Request & { userId: string },
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<boolean> {
    // Обновляем комментарий
    const { statusCode, statusMessage } =
      await this.commentService.updateComment(
        request.userId,
        commentId,
        updateCommentDto,
      );

    // Если при обновлении комментария возникли ошибки возращаем статус ошибки
    if (statusCode !== HttpStatus.NO_CONTENT) {
      throw new HttpException(statusMessage, statusCode);
    }

    return true;
  }
  // Удаление комментария
  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCommentById(
    @Param('commentId') commentId: string,
  ): Promise<boolean> {
    // Удаляем комментарий
    const isCommentDeleted = await this.commentService.deleteCommentById(
      commentId,
    );
    // Если при удалении комментария вернулись ошибка возвращаем ее
    if (!isCommentDeleted) {
      throw new HttpException('Comment is not found', HttpStatus.NOT_FOUND);
    }
    // Иначе возвращаем true
    return isCommentDeleted;
  }
  // Обновление лайк статуса комментария
  @Put(':commentId/like-status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateCommentLikeStatus(
    @Req() request: Request & { userId: string },
    @Param('commentId') commentId: string,
    @Body() addLikeStatusDTO: AddLikeStatusDTO,
  ): Promise<void> {
    // Обновляем лайк статус комментария
    const { statusCode, statusMessage } =
      await this.likeStatusService.updateLikeStatusOfComment(
        request.userId,
        commentId,
        addLikeStatusDTO,
      );

    // Если при обновлении комментария возникли ошибки возращаем статус ошибки 404
    if (statusCode === HttpStatus.NOT_FOUND) {
      throw new NotFoundException();
    }

    // Если при обновлении комментария возникли ошибки возращаем статус ошибки 400
    if (statusCode === HttpStatus.BAD_REQUEST) {
      throw new BadRequestException(statusMessage);
    }
  }
}
