import { $$$, Joi, PreUserModel, RESULT, getPlatformClient, prisma } from '..';
import { LicenseModel, Prisma, PrismaPromise, UserModel } from '@prisma/client';

import dayjs from 'dayjs';

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
    if (!license) throw RESULT.REQUIRED_LICENSE();
    return license;
  }

  public static async deleteLicense(
    user: UserModel
  ): Promise<() => PrismaPromise<UserModel>> {
    const { userId } = user;
    await prisma.licenseModel.deleteMany({
      where: { user: { some: { userId } } },
    });

    return () =>
      prisma.userModel.update({
        where: { userId },
        data: { licenseId: null },
      });
  }

  public static async setLicense(
    user: UserModel | PreUserModel,
    props: { licenseStr: string; bypass?: boolean }
  ): Promise<() => Prisma.Prisma__LicenseModelClient<LicenseModel>> {
    const { userId, realname, birthday } = user;
    const { licenseStr, bypass } = props;
    if (!bypass) {
      const isValid = await this.validateLicense({
        realname,
        birthday,
        licenseStr,
      });

      if (!isValid) throw RESULT.INVALID_LICENSE();
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
      const birthday = dayjs(form.birthday);
      const json = {
        realname: form.realname,
        birthday: birthday
          .add(birthday.utcOffset(), 'm')
          .add(1, 'days')
          .format('YYYY-MM-DD'),
        license: form.licenseStr.split('-'),
      };

      interface resJson {
        opcode: number;
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
    if (!isValid) throw RESULT.INVALID_LICENSE();
  }
}
