import express from 'express';
import { get, merge } from 'lodash';

import { getUserBySessionToken } from '../controller/userHelper';
import { CustomRequest } from '../types/express';
import Category from '../model/Category';
import Item from '../model/Item';
import { Types } from 'mongoose';
import { IUser } from '../types/userTypes';
import { RequestHandler } from 'express';


export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const sessionToken = req.cookies['GodHeranca-Auth'];
    console.log('Session Token:', sessionToken);

    if (!sessionToken) {

      return res.sendStatus(403); // Forbidden if no session token
    }

    const user = (await getUserBySessionToken(sessionToken)) as IUser;


    if (!user) {
      return res.sendStatus(403); // Forbidden if user not found
    }

    // Directly set req.user
    (req as CustomRequest).user = user;
    return next();
  } catch (error) {
    console.error('Error in isAuthenticated middleware:', error);
    return res.sendStatus(400); // Bad Request if any error occurs
  }
};


export const isOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const { id } = req.params; // Resource ID from URL parameters
    const currentUserId = (req as CustomRequest).user?._id?.toString(); // Access user ID

    if (!currentUserId) {
      return res.sendStatus(403); // Forbidden if user ID is undefined
    }

    if (currentUserId !== id) {
      return res.sendStatus(403); // Forbidden if user ID does not match resource ID
    }

    return next();
  } catch (error) {
    console.error('Error in isOwner middleware:', error);
    return res.sendStatus(500); // Internal Server Error
  }
};

export const isSupermarketOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const itemId = req.params.id;
    if (!itemId) {
      console.error('Item ID is missing');
      return res.status(400).json({ message: 'Item ID is required' });
    }

    const item = await Item.findById(itemId).populate('supermarket');
    if (!item) {
      console.error('Item not found');
      return res.status(404).json({ message: 'Item not found' });
    }

    let itemSupermarketId: string;

    if (item.supermarket instanceof Types.ObjectId) {
      itemSupermarketId = item.supermarket.toString(); // It's an ObjectId, just convert it to a string
    } else {
      // It's a populated object, so access the _id property
      itemSupermarketId = (item.supermarket as any)._id.toString();
    }

    const userSupermarketId = (
      req as CustomRequest
    ).user?.supermarketId?.toString(); // User's supermarket ID

    if (!userSupermarketId) {
      console.error('User supermarket ID is missing');
      return res.status(403).json({
        message:
          'Not authorized to perform this action (Missing User Supermarket ID)',
      });
    }

    if (userSupermarketId !== itemSupermarketId) {
      return res
        .status(403)
        .json({
          message: 'Not authorized to perform this action (ID Mismatch)',
        });
    }
    next(); // Proceed to deleteItemsById or any subsequent middleware
  } catch (error) {
    console.error('Error checking supermarket ownership:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};




export const isCategoryOwner = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const { id } = req.params;
    const userId = (req as CustomRequest).user?._id;

    if (!userId) {
      return res.status(403).json({ message: 'User not authenticated' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: 'User does not own this category' });
    }

    next();
  } catch (error) {
    console.error('Error in isCategoryOwner middleware:', error);
    return res
      .status(500)
      .json({ message: 'Error checking category ownership', error });
  }
};
