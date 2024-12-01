import crypto from 'crypto';
import dotenv from 'dotenv';
import jwt, { JwtPayload } from 'jsonwebtoken';

dotenv.config();

const SECRET = process.env.SECRET || 'GodHeranca-Auth';
console.log('SECRET:', SECRET);

export const random = () => crypto.randomBytes(128).toString('base64');
export const authentication = (salt: String, id: String) => {
  const token = crypto
    .createHmac('sha256', [salt, id].join('/'))
    .update(SECRET)
    .digest('hex');
  return token.slice(0, 128);
};

export const generateJWT = (payload: object, expiresIn: string | number) => {
  // Create a JWT token using the provided payload
  const token = jwt.sign(payload, SECRET, {
    expiresIn: expiresIn, // You can use the `expiresIn` passed to the function
  });
  console.log('Generated Token:', token); // Log the token to check its format
  return token;
};

