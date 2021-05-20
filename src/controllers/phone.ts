import { PhoneModel } from '@prisma/client';
import { Database, InternalError, OPCODE } from '../tools';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
const { prisma } = Database;

const phoneUtil = PhoneNumberUtil.getInstance();

export class Phone {
  public static async createPhone(phone: string): Promise<PhoneModel> {
    phone = phoneUtil.format(
      phoneUtil.parse(phone, 'KR'),
      PhoneNumberFormat.E164
    );

    return prisma.phoneModel.create({ data: { phone } });
  }

  public static async getPhone(phoneId: string): Promise<PhoneModel | null> {
    return prisma.phoneModel.findFirst({ where: { phoneId } });
  }

  public static async getPhoneOrThrow(phoneId: string): Promise<PhoneModel> {
    const phone = await this.getPhone(phoneId);
    if (!phone) {
      throw new InternalError(
        '전화번호를 다시 인증해주세요.',
        OPCODE.NOT_FOUND
      );
    }

    return phone;
  }

  public static async revokePhone(phoneId: string): Promise<PhoneModel> {
    return prisma.phoneModel.update({
      where: { phoneId },
      data: { usedAt: new Date() },
    });
  }
}
