import { UserDocument, UserModelType } from '../../user/schemas';
import { MakeUserModel } from '../types';

export type UserStaticsType = {
  make: (
    makeUserModel: MakeUserModel,
    UserModel: UserModelType,
  ) => UserDocument;
};
