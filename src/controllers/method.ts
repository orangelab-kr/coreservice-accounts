import {
  MethodModel,
  MethodProvider,
  Prisma,
  PrismaPromise,
  UserModel,
} from '@prisma/client';
import dayjs from 'dayjs';
import Joi from 'joi';
import {
  $$$,
  kakao,
  Phone,
  PreUserModel,
  prisma,
  RESULT,
  User,
  UserInfo,
} from '..';

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

  public static async getMethodOrThrow(
    user: UserModel,
    provider: MethodProvider,
    showValue = false
  ): Promise<MethodModel> {
    const method = await $$$(Method.getMethod(user, provider, showValue));
    if (!method) throw RESULT.NOT_CONNECTED_WITH_METHOD();
    return method;
  }

  public static async getMethod(
    user: UserModel | PreUserModel,
    provider: MethodProvider,
    showIdentity = false
  ): Promise<() => Prisma.Prisma__MethodModelClient<MethodModel | null>> {
    const { userId } = user;
    return () =>
      prisma.methodModel.findFirst({
        where: { userId, provider },
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

  public static async disconnectMethod(
    user: UserModel,
    provider: MethodProvider
  ): Promise<() => Prisma.Prisma__MethodModelClient<MethodModel>> {
    const method = await Method.getMethodOrThrow(user, provider);
    if (!method) throw RESULT.NOT_CONNECTED_WITH_METHOD();
    const { methodId } = method;
    return () => prisma.methodModel.delete({ where: { methodId } });
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
    const type = MethodProvider.kakao;
    const { id, raw } = await kakao.getAuthUser(accessToken);
    const method = await Method.getMethodWithValue(type, `${id}`, true);
    if (method) return Method.getUserByMethodOrThrow(method);
    const phoneNo = Phone.getFormattedPhone(raw.kakao_account.phone_number);
    const user = await User.getUserByPhoneOrThrow(phoneNo);
    if (!user) throw RESULT.NOT_REGISTERED_USER();
    await $$$(Method.connectKakaoMethod(user, accessToken));
    return user;
  }

  public static async connectMethod(
    user: UserModel | PreUserModel,
    props: {
      provider: MethodProvider;
      identity: string;
      description: string;
    }
  ): Promise<() => Prisma.Prisma__MethodModelClient<MethodModel>> {
    const { userId } = user;
    const { provider, identity, description } = props;
    const method = await $$$(Method.getMethod(user, provider));
    if (method) throw RESULT.ALREADY_CONNECT_WITH_METHOD();
    return () =>
      prisma.methodModel.create({
        data: {
          userId,
          provider,
          identity,
          description,
        },
      });
  }

  public static async getUserByMethodOrThrow(
    method: MethodModel
  ): Promise<UserModel> {
    const user = await this.getUserByMethod(method);
    if (!user) throw RESULT.CANNOT_FIND_USER();
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
    const phone = await Phone.createPhone(user.phone_number);
    return { realname, email, birthday, phone, methods };
  }

  public static async connectKakaoMethod(
    user: UserModel | PreUserModel,
    accessToken: string
  ): Promise<() => Prisma.Prisma__MethodModelClient<MethodModel>> {
    const provider = MethodProvider.kakao;
    const { id: identity, nickname } = await kakao.getAuthUser(accessToken);
    const description = `${nickname}님의 카카오 계정`;
    return this.connectMethod(user, { provider, identity, description });
  }
}
