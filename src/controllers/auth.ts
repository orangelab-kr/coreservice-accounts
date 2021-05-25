import { PhoneModel, Prisma, PrismaPromise, UserModel } from '@prisma/client';
import * as UUID from 'uuid';
import { $$$, Joi, License, Method, Phone } from '..';
import { $PQ, Database, InternalError, OPCODE } from '../tools';

const { prisma } = Database;

export interface PreUserModel {
  userId: string;
  phoneNo: string;
  email?: string;
  birthday: Date;
  realname: string;
}

export interface UserInfo {
  realname: string;
  birthday: Date;
  email?: string;
  phone: {
    phoneId: string;
    phoneNo: string;
    code: string | null;
  };
  licenseStr?: string;
  methods?: {
    kakao?: string;
  };
}

export class Auth {
  public static async signupUser(props: UserInfo): Promise<UserModel> {
    const transactions: PrismaPromise<any>[] = [];
    const schema = Joi.object({
      realname: Joi.string().max(16).required(),
      birthday: Joi.date().required(),
      email: Joi.string().email().optional(),
      phone: Joi.object({
        phoneId: Joi.string().uuid().required(),
        phoneNo: Joi.string().required(),
        code: Joi.string().allow(null).optional(),
      }).required(),
      licenseStr: Joi.string().optional(),
      methods: Joi.object({
        kakao: Joi.string().optional(),
      }).optional(),
    });

    const { realname, birthday, email, phone, licenseStr, methods } =
      await schema.validateAsync(props);

    const [userId, phoneObj] = await Promise.all([
      this.getUnusedUserId(),
      Phone.getPhoneOrThrow(phone.phoneId),
    ]);

    const { phoneNo } = phoneObj;
    await Phone.isUnusedPhoneNoOrThrow(phoneNo);
    transactions.push(
      prisma.userModel.create({
        data: {
          userId,
          realname,
          birthday,
          email,
          phoneNo,
        },
      })
    );

    const preUser: PreUserModel = {
      userId,
      realname,
      birthday,
      phoneNo,
    };

    const asyncLicense = async () => {
      if (!licenseStr) return;
      const createLicense = await License.setLicense(preUser, licenseStr);
      transactions.push(createLicense());
    };

    const asyncMethodKakao = async () => {
      if (!methods || !methods.kakao) return;
      const accessToken = methods.kakao;
      const createMethod = await Method.connectKakaoMethod(
        preUser,
        accessToken
      );

      transactions.push(createMethod());
    };

    await Promise.all([asyncLicense(), asyncMethodKakao()]);
    const [user] = await prisma.$transaction(transactions);
    await $$$(Phone.revokePhone(phoneObj));

    return user;
  }

  public static async modifyUser(
    user: UserModel,
    props: UserInfo
  ): Promise<UserModel> {
    const transactions: Promise<() => PrismaPromise<any>>[] = [];
    const schema = Joi.object({
      realname: Joi.string().max(16).optional(),
      birthday: Joi.date().optional(),
      email: Joi.string().email().optional(),
      phone: Joi.object({
        phoneId: Joi.string().uuid().required(),
        phoneNo: Joi.string().required(),
        code: Joi.string().allow(null).required(),
      }).optional(),
    });

    const { userId } = user;
    const where = { userId };
    const data: Prisma.UserModelUpdateInput = {};
    const { realname, birthday, email, phone } = await schema.validateAsync(
      props
    );

    let phoneObj: PhoneModel | undefined;
    if (realname && realname !== user.realname) data.realname = realname;
    if (birthday && birthday !== user.birthday) data.birthday = birthday;
    if (email && email !== user.email) data.email = email;
    if (phone) {
      phoneObj = await Phone.getPhoneOrThrow(phone.phoneId);
      if (phoneObj.phoneNo !== user.phoneNo) {
        await Phone.isUnusedPhoneNoOrThrow(phoneObj.phoneNo);
        data.phoneNo = phoneObj.phoneNo;
      }
    }

    transactions.push($PQ(prisma.userModel.update({ where, data })));
    if (phoneObj) transactions.push(Phone.revokePhone(phoneObj));
    if (data.realname || data.birthday) {
      transactions.push(License.deleteLicense(user));
    }

    const [updatedUser] = await $$$(transactions);
    return updatedUser;
  }

  public static async getUserOrThrow(userId: string): Promise<UserModel> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new InternalError('사용자를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    return user;
  }

  public static async getUser(userId: string): Promise<UserModel | null> {
    return prisma.userModel.findFirst({ where: { userId } });
  }

  public static async getUserByPhoneOrThrow(
    phoneNo: string
  ): Promise<UserModel> {
    const user = await this.getUserByPhone(phoneNo);
    if (!user) {
      throw new InternalError('사용자를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    return user;
  }

  public static async getUserByPhone(
    phoneNo: string
  ): Promise<UserModel | null> {
    return prisma.userModel.findFirst({ where: { phoneNo } });
  }

  public static async getUnusedUserId(): Promise<string> {
    let userId;
    while (true) {
      userId = UUID.v1();
      const user = await this.getUser(userId);
      if (!user) return userId;
    }
  }
}
