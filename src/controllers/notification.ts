import {
  NotificationModel,
  NotificationType,
  Prisma,
  UserModel,
} from '@prisma/client';
import { $$$, Joi, messaging, prisma, RESULT } from '..';

export class Notification {
  public static async sendNotification(
    user: UserModel,
    props: {
      type: NotificationType;
      title?: string;
      description?: string;
      url?: string;
      visible?: boolean;
    }
  ): Promise<NotificationModel> {
    const notification: NotificationModel = await $$$(
      Notification.createNotification(user, props)
    );

    if (Notification.isAllowPush(user, notification)) {
      await Notification.sendPush(notification);
    }

    return notification;
  }

  public static isAllowPush(
    user: UserModel,
    notification: NotificationModel
  ): boolean {
    if (user.receivePush) return true;
    if (notification.type !== NotificationType.advisting) return true;
    return false;
  }

  public static async createNotification(
    user: UserModel,
    props: {
      type: NotificationType;
      title?: string;
      description?: string;
      url?: string;
      visible?: boolean;
      readedAt?: Date;
      sendedAt?: Date;
    }
  ): Promise<() => Prisma.Prisma__NotificationModelClient<NotificationModel>> {
    const { userId } = user;
    const { type, title, description, url, visible, readedAt, sendedAt } =
      await Joi.object({
        type: Joi.string()
          .valid(...Object.keys(NotificationType))
          .required(),
        title: Joi.string().min(2).max(200).optional(),
        description: Joi.string().max(1024).optional(),
        url: Joi.string().uri().optional(),
        visible: Joi.boolean().default(true).optional(),
        readedAt: Joi.date().optional(),
        sendedAt: Joi.date().optional(),
      }).validateAsync(props);
    return () =>
      prisma.notificationModel.create({
        data: {
          type,
          userId,
          title,
          description,
          url,
          visible,
          readedAt,
          sendedAt,
        },
      });
  }

  public static async sendPush(notification: NotificationModel): Promise<void> {
    const { userId } = notification;
    const select = { messagingToken: true };
    const where = { userId, messagingToken: { not: null } };
    const tokens = <string[]>[
      ...new Set(
        await prisma.sessionModel
          .findMany({ where, select })
          .then((s) => s.map((s) => s.messagingToken))
          .then((s) => s.filter((s) => !!s))
      ),
    ];

    if (tokens.length <= 0) return;
    const data = notification.url ? { url: notification.url } : undefined;
    await messaging.sendMulticast({
      data,
      tokens,
      notification: {
        title: notification.title || undefined,
        body: notification.description || undefined,
      },
    });

    await $$$(
      Notification.modifyNotification(notification, { sendedAt: new Date() })
    );
  }

  public static async getNotification(
    user: UserModel,
    notificationId: string
  ): Promise<
    () => Prisma.Prisma__NotificationModelClient<NotificationModel | null>
  > {
    const { userId } = user;
    return () =>
      prisma.notificationModel.findFirst({
        where: { userId, notificationId },
      });
  }

  public static async getNotificationOrThrow(
    user: UserModel,
    notificationId: string
  ): Promise<NotificationModel> {
    const notification = await $$$(
      Notification.getNotification(user, notificationId)
    );

    if (!notification) throw RESULT.CANNOT_FIND_NOTIFICATION();
    return notification;
  }

  public static async getNotifications(
    user: UserModel,
    props: {
      take?: number;
      skip?: number;
      search?: string;
      types?: string[];
      orderByField?: 'sendedAt' | 'readedAt' | 'createdAt' | 'updatedAt';
      orderBySort?: 'asc' | 'desc';
      withUnvisible?: boolean;
    }
  ): Promise<{ total: number; notifications: NotificationModel[] }> {
    const { userId } = user;
    const {
      take,
      skip,
      search,
      types,
      orderByField,
      orderBySort,
      withUnvisible,
    } = await Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      types: Joi.array()
        .items(Joi.string().valid(...Object.keys(NotificationType)))
        .optional(),
      orderByField: Joi.string()
        .valid('sendedAt', 'readedAt', 'createdAt', 'updatedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
      withUnvisible: Joi.boolean().optional(),
    }).validateAsync(props);
    const where: Prisma.NotificationModelWhereInput = { userId };
    if (types) where.type = { in: types };
    if (!withUnvisible) where.visible = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = { [orderByField]: orderBySort };
    const [total, notifications] = await prisma.$transaction([
      prisma.notificationModel.count({ where }),
      prisma.notificationModel.findMany({ where, orderBy, take, skip }),
    ]);

    return { total, notifications };
  }

  public static async modifyNotification(
    notification: NotificationModel,
    props: {
      type?: NotificationType;
      title?: string | null;
      description?: string | null;
      url?: string | null;
      visible?: boolean;
      readedAt?: Date | null;
      sendedAt?: Date | null;
    }
  ): Promise<() => Prisma.Prisma__NotificationModelClient<Notification>> {
    const { notificationId } = notification;
    const { type, title, description, url, visible, readedAt, sendedAt } =
      await Joi.object({
        type: Joi.string()
          .valid(...Object.keys(NotificationType))
          .optional(),
        title: Joi.string().min(2).max(200).allow(null).optional(),
        description: Joi.string().max(1024).allow(null).optional(),
        url: Joi.string().uri().allow(null).optional(),
        visible: Joi.boolean().optional(),
        readedAt: Joi.date().allow(null).optional(),
        sendedAt: Joi.date().allow(null).optional(),
      }).validateAsync(props);
    return () =>
      prisma.notificationModel.update({
        where: { notificationId },
        data: { type, title, description, url, visible, readedAt, sendedAt },
      });
  }

  public static async deleteNotification(
    notification: NotificationModel
  ): Promise<() => Prisma.Prisma__NotificationModelClient<Notification>> {
    const { notificationId } = notification;
    return () => prisma.notificationModel.delete({ where: { notificationId } });
  }
}
