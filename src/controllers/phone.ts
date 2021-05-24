import { PhoneModel, Prisma } from '@prisma/client';
import { Database, InternalError, OPCODE } from '../tools';
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';
const { prisma } = Database;

const phoneUtil = PhoneNumberUtil.getInstance();

export class Phone {
  public static async createPhone(phoneNo: string): Promise<PhoneModel> {
    phoneNo = phoneUtil.format(
      phoneUtil.parse(phoneNo, 'KR'),
      PhoneNumberFormat.E164
    );

    return prisma.phoneModel.create({ data: { phoneNo } });
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

  public static async getPhone(phoneId: string): Promise<PhoneModel | null> {
    return prisma.phoneModel.findFirst({ where: { phoneId, usedAt: null } });
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
