import config from '@config/index';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  _id?: string;
  email: string;
  otp?: string;
}

interface DecodedToken extends TokenPayload, jwt.JwtPayload {}

export function generateTokenAsync(payload: TokenPayload): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      config.JWT.SECRET,
      { expiresIn: config.JWT.EXPIRES_IN },
      (err, token) => {
        if (err || !token) {
          return reject(err);
        } else {
          return resolve(token);
        }
      },
    );
  });
}

export function verifyTokenAsync(token: string): Promise<DecodedToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.JWT.SECRET, (err, decoded) => {
      if (err || !decoded) {
        return reject(err);
      } else {
        return resolve(decoded as DecodedToken);
      }
    });
  });
}
