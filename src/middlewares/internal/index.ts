import dayjs from 'dayjs';
import jwt from 'jsonwebtoken';
import { Joi, logger, RESULT, Wrapper, WrapperCallback } from '../..';

export * from './pass';
export * from './passProgram';
export * from './user';

export function InternalMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { headers, query } = req;
    const token = headers.authorization
      ? headers.authorization.substr(7)
      : query.token;

    if (typeof token !== 'string') throw RESULT.REQUIRED_ACCESS_KEY();
    const key = process.env.HIKICK_CORESERVICE_ACCOUNTS_KEY;
    if (!key || !token) throw RESULT.REQUIRED_ACCESS_KEY();

    try {
      const data = jwt.verify(token, key);
      const schema = Joi.object({
        sub: Joi.string().valid('coreservice-accounts').required(),
        iss: Joi.string().required(),
        aud: Joi.string().email().required(),
        iat: Joi.date().timestamp().required(),
        exp: Joi.date().timestamp().required(),
      });

      const payload = await schema.validateAsync(data);
      const iat = dayjs(payload.iat);
      const exp = dayjs(payload.exp);

      req.internal = payload;
      if (exp.diff(iat, 'hours') > 6) throw Error();
      logger.info(
        `Internal / ${payload.aud}(${payload.iss}) - ${req.method} ${req.originalUrl}`
      );
    } catch (err: any) {
      logger.error(err.message);
      logger.error(err.stack);

      throw RESULT.REQUIRED_ACCESS_KEY();
    }

    next();
  });
}
