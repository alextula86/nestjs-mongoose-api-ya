import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { CqrsModule } from '@nestjs/cqrs';

import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { User, UserSchema } from '@src/api/user/schemas';
import { Blog, BlogSchema } from '@src/api/blog/schemas';
import { Post, PostSchema } from '@src/api/post/schemas';
import { Comment, CommentSchema } from '@src/api/comment/schemas';
import { Device, DeviceSchema } from '@src/api/device/schemas';
import { Session, SessionSchema } from '@src/api/session/schemas';
import { LikeStatus, LikeStatusSchema } from '@src/api/likeStatus/schemas';

import { AuthController } from '@src/api/auth/auth.controller';
import { UserController } from '@src/api/user/user.controller';
import { BlogController } from '@src/api/blog/blog.controller';
import { BloggerController } from '@src/api/blog/blogger.controller';
import { SABlogController } from '@src/api/blog/sa-blog.controller';
import { PostController } from '@src/api/post/post.controller';
import { DeviceController } from '@src/api/device/device.controller';
import { CommentController } from '@src/api/comment/comment.controller';
import { TestingController } from '@src/api/testing/testing.controller';

import { AuthService } from '@src/api/auth/auth.service';
import { UserService } from '@src/api/user/user.service';
import { BlogService } from '@src/api/blog/blog.service';
import { PostService } from '@src/api/post/post.service';
import { CommentService } from '@src/api/comment/comment.service';
import { DeviceService } from '@src/api/device/device.service';
import { SessionService } from '@src/api/session/session.service';
import { LikeStatusService } from '@src/api/likeStatus/likeStatus.service';

import {
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendingUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
} from '@src/api/auth/use-cases';
import { CreateUserUseCase, BanUserUseCase } from '@src/api/user/use-cases';
import {
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  BindWithUserBlogUseCase,
} from '@src/api/blog/use-cases';
import {
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
} from '@src/api/post/use-cases';
import {
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
} from '@src/api/comment/use-cases';
import {
  DeleteAllDevicesUseCase,
  DeleteDeviceByIdUseCase,
} from '@src/api/device/use-cases';
import {
  CreateSessionUseCase,
  IncreaseAttemptSessionUseCase,
  ResetAttemptSessionUseCase,
} from '@src/api/session/use-cases';
import {
  UpdateLikeStatusCommentUseCase,
  UpdateLikeStatusPostUseCase,
} from '@src/api/likeStatus/use-cases';

import { UserRepository } from '@src/api/user/user.repository';
import { BlogRepository } from '@src/api/blog/blog.repository';
import { PostRepository } from '@src/api/post/post.repository';
import { CommentRepository } from '@src/api/comment/comment.repository';
import { DeviceRepository } from '@src/api/device/device.repository';
import { SessionRepository } from '@src/api/session/session.repository';
import { LikeStatusRepository } from '@src/api/likeStatus/likeStatus.repository';

import { UserQueryRepository } from '@src/api/user/user.query.repository';
import { BlogQueryRepository } from '@src/api/blog/blog.query.repository';
import { PostQueryRepository } from '@src/api/post/post.query.repository';
import { CommentQueryRepository } from '@src/api/comment/comment.query.repository';
import { DeviceQueryRepository } from '@src/api/device/device.query.repository';
import { AuthQueryRepository } from '@src/api/auth/auth.query.repository';

import { EmailAdapter } from '@src/adapters';
import { EmailManager } from '@src/managers';
import { IsBlogExistConstraint } from '@src/api/blog/custom-validators/customValidateBlog';

const authProviders = [
  AuthService,
  AuthQueryRepository,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  RegisterUserUseCase,
  RegistrationConfirmationUseCase,
  RegistrationEmailResendingUseCase,
  PasswordRecoveryUseCase,
  NewPasswordUseCase,
];
const userProviders = [
  UserService,
  UserRepository,
  UserQueryRepository,
  CreateUserUseCase,
  BanUserUseCase,
];
const blogProviders = [
  IsBlogExistConstraint,
  BlogService,
  BlogRepository,
  BlogQueryRepository,
  CreateBlogUseCase,
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  BindWithUserBlogUseCase,
];
const postProviders = [
  PostService,
  PostRepository,
  PostQueryRepository,
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
];
const commentProviders = [
  CommentService,
  CommentRepository,
  CommentQueryRepository,
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
];
const deviceProviders = [
  DeviceService,
  DeviceRepository,
  DeviceQueryRepository,
  DeleteAllDevicesUseCase,
  DeleteDeviceByIdUseCase,
];
const sessionSProviders = [
  SessionService,
  SessionRepository,
  CreateSessionUseCase,
  IncreaseAttemptSessionUseCase,
  ResetAttemptSessionUseCase,
];
const likeStatusSProviders = [
  LikeStatusService,
  LikeStatusRepository,
  UpdateLikeStatusCommentUseCase,
  UpdateLikeStatusPostUseCase,
];
const adapters = [EmailManager, EmailAdapter];

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_ATLAS_URI || 'mongodb://127.0.0.1/bloggers',
    ),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    MongooseModule.forFeature([
      { name: LikeStatus.name, schema: LikeStatusSchema },
    ]),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'a.marcuk2023@gmail.com',
          pass: 'suflbzalydymjqnt',
        },
      },
      defaults: {
        from: '"nestjs-video-api" <a.marcuk2023@gmail.com>',
      },
    }),
    CqrsModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    BlogController,
    BloggerController,
    SABlogController,
    PostController,
    CommentController,
    DeviceController,
    TestingController,
  ],
  providers: [
    AppService,
    ...authProviders,
    ...userProviders,
    ...blogProviders,
    ...postProviders,
    ...commentProviders,
    ...deviceProviders,
    ...sessionSProviders,
    ...likeStatusSProviders,
    ...adapters,
  ],
  exports: [
    BlogService,
    BlogRepository,
    BlogQueryRepository,

    PostService,
    PostRepository,
    PostQueryRepository,

    CommentService,
    CommentRepository,
    CommentQueryRepository,

    DeviceService,
    DeviceRepository,
    DeviceQueryRepository,

    SessionService,
    SessionRepository,

    LikeStatusService,
    LikeStatusRepository,
  ],
})
export class AppModule {}
