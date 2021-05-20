import { MethodModel, MethodProvider, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import Joi from 'joi';
import { kakao, Phone, UserInfo } from '..';
import { Database } from '../tools';

const { prisma } = Database;

export class Method {
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
