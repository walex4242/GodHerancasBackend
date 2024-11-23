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


      if (updates.password) {
        if (updates.password.length < 8) {
          res
            .status(400)
            .json({ message: 'Password must be at least 8 characters long' });
          return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updates.password, salt);
        updates['authentication.password'] = hashedPassword;
        delete updates.password; // Remove plaintext password
      }


    if (req.file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({ message: 'Invalid file type' });
        return;
      }
      updates.profilePicture = await req.storage?.uploadFile(req.file);
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

       if (updates.currentPassword) {
         const isMatch = await bcrypt.compare(
           updates.currentPassword,
           user.authentication.password,
         );
         if (!isMatch) {
           res.status(400).json({ message: 'Current password is incorrect' });
           return;
         }
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

    // Update associated entity based on userType
    switch (user.userType) {
      case 'Supermarket':
        await Supermarket.findByIdAndUpdate(user.supermarketId, {
          name: updatedUser.profile,
          image: updatedUser.profilePicture || '',
          address: updatedUser.address ? updatedUser.address.join(', ') : '',
        });
        break;

      case 'Driver':
        await Driver.findByIdAndUpdate(user.driverId, {
          name: updatedUser.profile,
          licenseNumber: updatedUser.profile,
        });
        break;

      case 'Client':
        await Client.findByIdAndUpdate(user.clientId, {
          name: updatedUser.profile,
        });
        break;

      case 'Picker':
        await Picker.findByIdAndUpdate(user.pickerId, {
          name: updatedUser.profile,
        });
        break;

      case 'Admin':
        await Admin.findByIdAndUpdate(user.adminId, {
          name: updatedUser.profile,
        });
        break;
    }

    res.status(200).json(updatedUser);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
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
