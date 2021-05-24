import {
  MethodModel,
  MethodProvider,
  Prisma,
  PrismaPromise,
  UserModel,
} from '@prisma/client';
import dayjs from 'dayjs';
import Joi from 'joi';
import { kakao, Phone, UserInfo } from '..';
import { Database, InternalError, OPCODE } from '../tools';

const { prisma } = Database;

export class Method {
  public static async getMethods(
    user: UserModel,
    showIdentity = false
  ): Promise<() => PrismaPromise<MethodModel[]>> {
    const { userId } = user;
    return () =>
      prisma.methodModel.findMany({
        where: { userId },
        select: {
          methodId: true,
          description: true,
          userId: true,
          provider: true,
          identity: showIdentity,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });
  }

  public static async getMethodWithValue(
    provider: MethodProvider,
    identity: string,
    showIdentity = false
  ): Promise<MethodModel | null> {
    const method = await prisma.methodModel.findFirst({
      where: { provider, identity },
      select: {
        methodId: true,
        description: true,
        userId: true,
        provider: true,
        identity: showIdentity,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return <MethodModel | null>method;
  }

  public static async loginWithKakao(accessToken: string): Promise<UserModel> {
    try {
      const type = MethodProvider.kakao;
      const { id } = await kakao.getAuthUser(accessToken);
      const method = await Method.getMethodWithValue(type, `${id}`, true);
      if (!method) {
        throw new InternalError(
          '회원가입되지 않은 사용자입니다.',
          OPCODE.NOT_FOUND
        );
      }

      const user = await Method.getUserByMethodOrThrow(method);
      return user;
    } catch (err) {
      throw new InternalError(
        '카카오 로그인에 실패하였습니다. 다시 시도해주세요.',
        OPCODE.ERROR
      );
    }
  }

  public static async getUserByMethodOrThrow(
    method: MethodModel
  ): Promise<UserModel> {
    const user = await this.getUserByMethod(method);
    if (!user) {
      throw new InternalError('사용자를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    return user;
  }

  public static async getUserByMethod(
    method: MethodModel
  ): Promise<UserModel | null> {
    const { methodId } = method;
    const user = await prisma.methodModel
      .findFirst({ where: { methodId } })
      .user();

    return user;
  }

  public static async getUserInfoByKakao(props: {
    accessToken: string;
  }): Promise<UserInfo> {
    const schema = Joi.object({ accessToken: Joi.string().required() });
    const { accessToken } = await schema.validateAsync(props);
    const user = await kakao
      .getAuthUser(accessToken)
      .then((res) => res.raw.kakao_account);

    const {
      email,
      profile: { nickname: realname },
    } = user;
    const utc = { utc: true };
    const methods = { kakao: accessToken };
    const birthday = dayjs(`${user.birthyear}${user.birthday}`, utc).toDate();
    const phone = await Phone.createPhone(user.phone_number).then(
      ({ phoneId, phoneNo, code }) => ({ phoneId, phoneNo, code })
    );

    return { realname, email, birthday, phone, methods };
  }

  public static async createKakaoMethod(
    userId: string,
    accessToken: string
  ): Promise<() => Prisma.Prisma__MethodModelClient<MethodModel>> {
    const provider = MethodProvider.kakao;
    const { id: identity, nickname } = await kakao.getAuthUser(accessToken);
    const description = `${nickname}님의 카카오 계정`;
    return () =>
      prisma.methodModel.create({
        data: {
          userId,
          provider,
          description,
          identity,
        },
      });
  }
}