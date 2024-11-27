import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.SECRET || '';

export const random = () => crypto.randomBytes(128).toString('base64');
export const authentication = (salt: String, id: String) => {
  const token = crypto
    .createHmac('sha256', [salt, id].join('/'))
    .update(SECRET)
    .digest('hex');
  return token.slice(0, 128);
};
