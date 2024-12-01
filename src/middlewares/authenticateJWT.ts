import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Define the middleware to verify the JWT
export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  // Try to get the token from the Authorization header first
  const authHeader = req.headers['authorization'];

  let token: string | undefined;

  // If the Authorization header exists, extract the token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]; // Extract token from Bearer header
  } else {
    // If no Authorization header, try to get it from cookies
    token = req.cookies.token;
    
  }

  // If no token found, return a 403 error
  if (!token) {
    return res.status(403).json({
      status: false,
      message: 'No token provided or invalid token format',
    });
  }

  // Verify the token
  jwt.verify(
    token,
    process.env.JWT_SECRET || 'GodHeranca-Auth',
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      // Cast the decoded token as a JwtPayload
      const decodedToken = decoded as JwtPayload;

      // Ensure the payload includes the supermarketId
      if (!decodedToken.supermarketId) {
        return res.status(403).json({
          message: 'No supermarketId found in token',
        });
      }

      // Assign user information to req.user
      req.user = {
        _id: decodedToken.id || decodedToken._id, // Assuming ID is present in the token
        supermarketId: decodedToken.supermarketId, // Add supermarketId to req.user
      };

      // Proceed to the next middleware or route handler
      next();
    },
  );
};
