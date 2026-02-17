import type { Request, Response, NextFunction } from 'express';
import pkg from 'jsonwebtoken';
const { verify } = pkg;

interface IPayload {
  sub: string;
}

export function ensureAuthenticated( req: Request, res: Response, next: NextFunction) {
  const authToken = req.headers.authorization;

  if (!authToken) {
    return res.status(401).end(); 
  }
  const [, token] = authToken.split(" ");

  if(!token) {
    return res.status(401).end();
  }

  try {
    const { sub } = verify(
      token,
      process.env.JWT_SECRET as string
    ) as IPayload;
    
    req.user_id = sub;

    return next(); 

  } catch (err) {
    return res.status(401).end();
  }
}