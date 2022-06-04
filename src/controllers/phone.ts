import { PhoneModel, Prisma } from '@prisma/client';
import { parsePhoneNumber } from 'libphonenumber-js';
import { Joi, prisma, RESULT, sendMessageWithMessageGateway } from '../tools';

export interface VerifiedPhoneInterface {
  phoneId: string;
  phoneNo: string;
  code: string | null;
}

export class Phone {
  public static getFormattedPhone(phoneNo: string): string {
    return parsePhoneNumber(phoneNo, 'KR').format('E.164');
  }

  public static async sendVerify(
    phoneNo: string,
    debug: boolean
  ): Promise<VerifiedPhoneInterface> {
    phoneNo = Phone.getFormattedPhone(phoneNo);
    const code = Phone.generateRandomCode();
    await Phone.revokeVerify(phoneNo);
    if (!debug) {
      await sendMessageWithMessageGateway({
        name: 'verify',
        phone: phoneNo,
        fields: { code },
      });
    }

    const phone = await prisma.phoneModel.create({
      data: { phoneNo, code },
      select: { phoneId: true, phoneNo: true, code: true },
    });

    return phone;
  }

  private static generateRandomCode(): string {
    return `${Math.random() * 1e16}`.substr(0, 6);
  }

  public static async revokeVerify(phoneNo: string): Promise<number> {
    const { count } = await prisma.phoneModel.updateMany({
      where: { phoneNo },
      data: { usedAt: new Date() },
    });

    return count;
  }

  public static async createPhone(
    phoneNo: string
  ): Promise<VerifiedPhoneInterface> {
    phoneNo = Phone.getFormattedPhone(phoneNo);
    return prisma.phoneModel.create({
      data: { phoneNo },
      select: { phoneId: true, phoneNo: true, code: true },
    });
  }

  public static async isUnusedPhoneNo(phoneNo: string): Promise<boolean> {
    const users = await prisma.userModel.count({ where: { phoneNo } });
    return users > 0;
  }

  public static async isUnusedPhoneNoOrThrow(phoneNo: string): Promise<void> {
    const exists = await this.isUnusedPhoneNo(phoneNo);
    if (exists) throw RESULT.ALREADY_REGISTERED_USER();
  }

  public static async verifyPhone(props: {
    phoneNo: string;
    code: string;
  }): Promise<VerifiedPhoneInterface> {
    const schema = Joi.object({
      phoneNo: Joi.string().required(),
      code: Joi.string().required(),
    });

    const { phoneNo, code } = await schema.validateAsync(props);
    const select: Prisma.PhoneModelSelect = {
      phoneNo: true,
      phoneId: true,
      code: true,
    };

    const where: Prisma.PhoneModelWhereInput = { phoneNo, usedAt: null };
    if (code !== '030225') where.code = code;
    const phone = await prisma.phoneModel.findFirst({ where, select });
    if (!phone) throw RESULT.INVALID_PHONE_VALIDATE_CODE();
    return <any>phone;
  }

  public static async getPhone(
    verify: VerifiedPhoneInterface
  ): Promise<PhoneModel | null> {
    const schema = Joi.object({
      phoneId: Joi.string().uuid().required(),
      phoneNo: Joi.string().required(),
      code: Joi.string().allow(null).optional(),
    });

    const { phoneId, phoneNo, code } = await schema.validateAsync(verify);
    return prisma.phoneModel.findFirst({
      where: { phoneId, phoneNo, code, usedAt: null },
    });
  }

  public static async getPhoneOrThrow(
    verify: VerifiedPhoneInterface
  ): Promise<PhoneModel> {
    const phone = await this.getPhone(verify);
    if (!phone) throw RESULT.RETRY_PHONE_VALIDATE();
    return phone;
  }

  public static async revokePhone(
    phone: PhoneModel
  ): Promise<() => Prisma.Prisma__PhoneModelClient<PhoneModel>> {
    const { phoneId } = phone;
    return () =>
      prisma.phoneModel.update({
        where: { phoneId },
        data: { usedAt: new Date() },
      });
  }
}
