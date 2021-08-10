import { PhoneModel, Prisma } from '@prisma/client';
import { Database, InternalError, Joi, OPCODE } from '../tools';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
const { prisma } = Database;

const phoneUtil = PhoneNumberUtil.getInstance();

export interface VerifiedPhoneInterface {
  phoneId: string;
  phoneNo: string;
  code: string | null;
}

export class Phone {
  public static async sendVerify(
    phoneNo: string
  ): Promise<VerifiedPhoneInterface> {
    phoneNo = phoneUtil.format(
      phoneUtil.parse(phoneNo, 'KR'),
      PhoneNumberFormat.E164
    );

    const code = Phone.generateRandomCode();
    await Phone.revokeVerify(phoneNo);

    // todo: send message
    const phone = await prisma.phoneModel.create({
      data: { phoneNo, code },
      select: { phoneId: true, phoneNo: true, code: true },
    });

    console.log(phone);
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
    phoneNo = phoneUtil.format(
      phoneUtil.parse(phoneNo, 'KR'),
      PhoneNumberFormat.E164
    );

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
    if (exists) {
      throw new InternalError(
        '이미 회원가입한 사용자입니다.',
        OPCODE.ALREADY_EXISTS
      );
    }
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
    const phone = await prisma.phoneModel.findFirst({
      where: { phoneNo, code, usedAt: null },
      select: { phoneNo: true, phoneId: true, code: true },
    });

    if (!phone) {
      throw new InternalError(
        '인증번호가 올바르지 않습니다.',
        OPCODE.NOT_FOUND
      );
    }

    return phone;
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
    if (!phone) {
      throw new InternalError(
        '전화번호를 다시 인증해주세요.',
        OPCODE.NOT_FOUND
      );
    }

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
