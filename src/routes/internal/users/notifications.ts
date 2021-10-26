import { Router } from 'express';
import {
  $$$,
  Notification,
  InternalUserNotificationMiddleware,
  RESULT,
  Wrapper,
} from '../../..';

export function getInternalUsersNotificationsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, notifications } = await Notification.getNotifications(
        req.internal.user,
        req.query
      );

      throw RESULT.SUCCESS({ details: { notifications, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const notification = await Notification.sendNotification(
        req.internal.user,
        req.body
      );

      throw RESULT.SUCCESS({ details: { notification } });
    })
  );

  router.get(
    '/:notificationId',
    InternalUserNotificationMiddleware(),
    Wrapper(async (req) => {
      const { notification } = req.internal;
      throw RESULT.SUCCESS({ details: { notification } });
    })
  );

  router.post(
    '/:notificationId',
    InternalUserNotificationMiddleware(),
    Wrapper(async (req) => {
      const notification = await $$$(
        Notification.modifyNotification(req.internal.notification, req.body)
      );

      throw RESULT.SUCCESS({ details: { notification } });
    })
  );

  router.delete(
    '/:notificationId',
    InternalUserNotificationMiddleware(),
    Wrapper(async (req) => {
      await $$$(Notification.deleteNotification(req.internal.notification));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
