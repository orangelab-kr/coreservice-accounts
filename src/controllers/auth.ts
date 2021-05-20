import dayjs from 'dayjs';
import { Joi, kakao } from '..';
import { Phone } from './phone';
export interface IUserInfo {
  realname: string;
  birthday: Date;
  email?: string;
  phone: string;
  phoneId: string;
  licenseStr?: string;
  methods?: {
    kakao?: string;
    apple?: string;
  };
}

export class Auth {
  public static async getUserInfoByKakao(props: {
    accessToken: string;
  }): Promise<IUserInfo> {
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
    const { phoneId, phone } = await Phone.createPhone(user.phone_number);
    return { realname, email, birthday, phone, phoneId, methods };
  }
}
