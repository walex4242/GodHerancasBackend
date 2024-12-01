import express from 'express';
import User from '../model/User';
import Admin from '../model/Admin';
import Client from '../model/Client';
import Driver from '../model/Driver';
import Picker from '../model/Picker';
import Supermarket from '../model/Supermarket';
import Category from '../model/Category';
import Item from '../model/Item';
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';

export const getAllUsers = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }
};

export const deleteUser = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Delete associated profiles and related data
    switch (user.userType) {
      case 'Supermarket':
        const supermarket = await Supermarket.findByIdAndDelete(
          user.supermarketId,
        );
        if (supermarket) {
          // Delete associated items and categories for this supermarket
          await Item.deleteMany({ supermarket: supermarket._id });
          await Category.deleteMany({ supermarket: supermarket._id });
        }
        break;

      case 'Driver':
        await Driver.findByIdAndDelete(user.driverId);
        break;

      case 'Client':
        await Client.findByIdAndDelete(user.clientId);
        break;

      case 'Picker':
        await Picker.findByIdAndDelete(user.pickerId);
        break;

      case 'Admin':
        await Admin.findByIdAndDelete(user.adminId);
        break;
    }

    res
      .status(200)
      .json({ message: 'User and all associated data deleted successfully' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }
};

export const updateUser = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    // Handle password update if provided
    if (updates.password) {
      if (updates.password.length < 8) {
        res
          .status(400)
          .json({ message: 'Password must be at least 8 characters long' });
        return;
      }
      if (!updates.currentPassword) {
        res
          .status(400)
          .json({
            message: 'Current password is required for password change',
          });
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const isMatch = await bcrypt.compare(
        updates.currentPassword,
        user.authentication.password,
      );
      if (!isMatch) {
        res.status(400).json({ message: 'Current password is incorrect' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      updates['authentication.password'] = await bcrypt.hash(
        updates.password,
        salt,
      );
      delete updates.password;
      delete updates.currentPassword;
    }

    // Handle profile picture update if a file is provided
    if (req.file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({ message: 'Invalid file type' });
        return;
      }
      updates.profilePicture = await req.storage?.uploadFile(req.file);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      select: '-authentication.password',
    });

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update associated entities based on userType
    switch (updatedUser.userType) {
      case 'Supermarket':
        await Supermarket.findByIdAndUpdate(updatedUser.supermarketId, {
          name: updatedUser.profile || '',
          image: updatedUser.profilePicture || '',
          address: updatedUser.address?.join(', ') || '',
        });
        break;

      case 'Driver':
        await Driver.findByIdAndUpdate(updatedUser.driverId, {
          name: updatedUser.profile || '',
        });
        break;

      case 'Client':
        await Client.findByIdAndUpdate(updatedUser.clientId, {
          name: updatedUser.profile || '',
        });
        break;

      case 'Picker':
        await Picker.findByIdAndUpdate(updatedUser.pickerId, {
          name: updatedUser.profile || '',
        });
        break;

      case 'Admin':
        await Admin.findByIdAndUpdate(updatedUser.adminId, {
          name: updatedUser.profile || '',
        });
        break;
    }

    // Generate a new JWT token with updated user data
    const token = jwt.sign(
      {
        id: updatedUser._id,
        userType: updatedUser.userType,
        email: updatedUser.email,
        supermarketId: updatedUser.supermarketId || null,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' },
    );

    res.status(200).json({ user: updatedUser, token });
  } catch (error: unknown) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
};


export const getUserOnly = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json(user);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }
};

export const updatePassword = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res
        .status(400)
        .json({ message: 'Password must be at least 8 characters long' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Compare the current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.authentication.password,
    );
    if (!isMatch) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.authentication.password = await bcrypt.hash(newPassword, salt);

    // Save the updated user
    await user.save();

    // Generate a new token with updated password
    const token = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
        email: user.email,
        supermarketId: user.supermarketId || null,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' },
    );

    res.status(200).json({ message: 'Password updated successfully', token });
  } catch (error: unknown) {
    res.status(500).json({
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
};

