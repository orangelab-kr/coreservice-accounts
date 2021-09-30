import { LicenseModel, Prisma, PrismaPromise, UserModel } from '@prisma/client';
import {
  $$$,
  getPlatformClient,
  InternalError,
  Joi,
  OPCODE,
  PreUserModel,
  prisma,
} from '..';

export class License {
  public static async getLicense(
    user: UserModel
  ): Promise<() => Prisma.Prisma__LicenseModelClient<LicenseModel | null>> {
    const { userId } = user;
    return () =>
      prisma.licenseModel.findFirst({
        where: { user: { some: { userId } } },
      });
  }

  public static async getLicenseOrThrow(
    user: UserModel
  ): Promise<LicenseModel> {
    const license = await $$$(this.getLicense(user));
    if (!license) {
      throw new InternalError(
        '면허 인증 후 이용할 수 있습니다.',
        OPCODE.NOT_FOUND
      );
    }

    return license;
  }

  public static async deleteLicense(
    user: UserModel
  ): Promise<() => PrismaPromise<Prisma.BatchPayload>> {
    const { userId } = user;
    return () =>
      prisma.licenseModel.deleteMany({
        where: { user: { some: { userId } } },
      });
  }

  public static async setLicense(
    user: UserModel | PreUserModel,
    licenseStr: string
  ): Promise<() => Prisma.Prisma__LicenseModelClient<LicenseModel>> {
    const { userId, realname, birthday } = user;
    const isValid = await this.validateLicense({
      realname,
      birthday,
      licenseStr,
    });

    if (!isValid) {
      throw new InternalError('올바른 운전면허가 아닙니다.', OPCODE.NOT_FOUND);
    }

    return () =>
      prisma.licenseModel.create({
        data: {
          realname,
          birthday,
          licenseStr,
          user: { connect: { userId } },
        },
      });
  }

  public static async validateLicense(props: {
    realname: string;
    birthday: Date;
    licenseStr: string;
  }): Promise<boolean> {
    try {
      const schema = Joi.object({
        realname: Joi.string().max(16).required(),
        birthday: Joi.date().required(),
        licenseStr: Joi.string()
          .regex(/^[가-힣|0-9]{2}-[0-9]{2}-[0-9]{6}-[0-9]{2}$/)
          .messages({
            'string.pattern.base': '올바른 운전면호 번호가 아닙니다.',
          }),
      });

      const platformClient = getPlatformClient();
      const form = await schema.validateAsync(props);
      const json = {
        realname: form.realname,
        birthday: form.birthday,
        license: form.licenseStr.split('-'),
      };

      interface resJson {
        opcode: OPCODE;
        isValid: boolean;
      }

      const res = await platformClient
        .post('license', { json })
        .json<resJson>();
      return res.isValid;
    } catch (err: any) {}
    return false;
  }

  public static async validateLicenseOrThrow(props: {
    realname: string;
    birthday: Date;
    licenseStr: string;
  }): Promise<void> {
    const isValid = this.validateLicense(props);
    if (!isValid) {
      throw new InternalError(
        '유효하지 않은 운전면허입니다.',
        OPCODE.NOT_FOUND
      );
    }
  }
}
