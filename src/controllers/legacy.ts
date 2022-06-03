import { UserModel } from '@prisma/client';
import {
  Exclude,
  Expose,
  plainToInstance,
  Transform,
  Type,
} from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  validate,
} from 'class-validator';
import { firestore } from 'firebase-admin';
import 'reflect-metadata';
import { prisma } from '..';
import { $$$, RESULT } from '../tools';
import { legacyFirestore } from '../tools/legacyFirestore';
import { License } from './license';
import { Phone } from './phone';
import { User } from './user';

@Exclude()
export class LegacyUser {
  @Expose()
  @IsString()
  legacyUserId!: string;

  @Expose()
  @IsString()
  @MaxLength(16)
  name!: string;

  @Expose()
  @IsString()
  phone!: string;

  @Expose()
  @Type(() => Object)
  @Transform((p) => new Date(p.value._seconds * 1000))
  birth!: Date;

  @Expose()
  @IsOptional()
  @IsString()
  @Type(() => Array)
  @Transform((p) =>
    p.value?.replace(
      /\[([0-9|가-핳]{2}), ([0-9]{2}), ([0-9]{6}), ([0-9]{2})\]/,
      '$1-$2-$3-$4'
    )
  )
  licenseNumber?: string;

  @Expose()
  @IsBoolean()
  push: boolean = false;

  @Expose()
  @IsBoolean()
  sms: boolean = false;

  constructor(props: firestore.DocumentData) {
    Object.assign(this, props);
  }
}

export class Legacy {
  public static async getUserByPhone(
    phoneNo: string
  ): Promise<LegacyUser | null> {
    const docs = await legacyFirestore
      .collection('users')
      .where('phone', '==', phoneNo)
      .limit(1)
      .get()
      .then((res) => res.docs);

    if (docs.length <= 0) return null;
    const payload = { ...docs[0].data(), legacyUserId: docs[0].id };
    const user = plainToInstance(LegacyUser, payload);
    const errors = await validate(user);
    if (errors.length > 0) return null;
    return user;
  }

  public static async migrateUser(legacyUser: LegacyUser): Promise<UserModel> {
    const {
      legacyUserId,
      name: realname,
      birth: birthday,
      licenseNumber: licenseStr,
      sms: receiveSMS,
      push: receivePush,
    } = legacyUser;

    const receiveEmail = false;
    const phone = await Phone.createPhone(legacyUser.phone);
    const user = await User.signupUser({
      realname,
      birthday,
      phone,
      receiveSMS,
      receivePush,
      receiveEmail,
    });

    if (licenseStr) {
      try {
        await $$$(License.setLicense(user, { licenseStr }));
      } catch (err) {}
    }

    await legacyFirestore
      .collection('users')
      .doc(legacyUserId)
      .update({ coreserviceUserId: user.userId });

    return prisma.userModel.update({
      where: { userId: user.userId },
      data: { legacyUserId },
    });
  }
}
