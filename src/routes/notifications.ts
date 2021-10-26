import { Router } from 'express';
import { $$$, Notification, NotificationMiddleware, RESULT, Wrapper } from '..';

export function getNotificationsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, notifications } = await Notification.getNotifications(
        req.user,
        req.query
      );

      throw RESULT.SUCCESS({ details: { notifications, total } });
    })
  );

  router.get(
    '/:notificationId',
    NotificationMiddleware(),
    Wrapper(async (req) => {
      const { notification } = req;
      throw RESULT.SUCCESS({ details: { notification } });
    })
  );

  router.get(
    '/:notificationId/read',
    NotificationMiddleware(),
    Wrapper(async (req) => {
      const payload = { readedAt: new Date() };
      const notification = await $$$(
        Notification.modifyNotification(req.notification, payload)
      );

      throw RESULT.SUCCESS({ details: { notification } });
    })
  );

  return router;
}
