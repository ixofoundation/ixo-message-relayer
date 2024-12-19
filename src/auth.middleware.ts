import { Request, Response, NextFunction } from 'express';

import { AUTHORIZATION } from './utils/secrets';

export function authorization(req: Request, res: Response, next: NextFunction) {
  console.log('req body', req.body);
  if (req.get('Authorization') === AUTHORIZATION) {
    next();
    return;
  }
  res.status(401).send('Authorization Failed');
  return;
}
