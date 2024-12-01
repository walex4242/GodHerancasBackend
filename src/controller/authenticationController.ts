import express from "express";
import User from "../model/User";
import { v4 as uuidv4 } from "uuid";
import Supermarket from "../model/Supermarket";
import Admin from "../model/Admin";
import Client from "../model/Client";
import Driver from "../model/Driver";
import Picker from "../model/Picker";
import mongoose from "mongoose";
import { sendMail } from "../helpers/email";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';

dotenv.config();

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: false, message: 'Email and password are required' });
    }

    // Find user by email and select the password field correctly
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+authentication.password',
    );

    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: 'Wrong login details' });
    }


    // Compare entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.authentication.password,
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: false, message: 'Wrong login details' });
    }

    // Generate JWT outside of try-catch to ensure token is accessible
    let token;
    try {
      token = jwt.sign(
        {
          id: user._id,
          userType: user.userType,
          email: user.email,
          supermarketId: user.supermarketId,
        },
        process.env.JWT_SECRET || 'GodHeranca-Auth',
        { expiresIn: '1h' },
      );
    } catch (err) {
      console.error('Error generating JWT:', err);
      return res
        .status(500)
        .json({ status: false, message: 'Error generating token' });
    }

    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 60 * 60 * 1000, // Token expiry
    });

    // Exclude sensitive fields from response
    const { password: _, ...userDetails } = user._doc;

    // Send response with user details and token
    res.status(200).json({
      ...userDetails,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res
      .status(500)
      .json({ status: false, message: 'An unexpected error occurred' });
  }
};
// Create User
export const register = async (
  req: express.Request,
  res: express.Response,
): Promise<void> => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      address,
      phone,
      userType,
      profilePicture,
      profile,
    } = req.body;

    if (!username || !email || !password || !confirmPassword || !userType) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    const allowedUserTypes = [
      'Supermarket',
      'Driver',
      'Client',
      'Picker',
      'Admin',
    ];
    if (!allowedUserTypes.includes(userType)) {
      res.status(400).json({ message: 'Invalid user type' });
      return;
    }

    const addressArray = Array.isArray(address)
      ? address.filter((addr) => typeof addr === 'string' && addr.trim() !== '')
      : [address].filter(
          (addr) => typeof addr === 'string' && addr.trim() !== '',
        );

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const hashedVerificationToken = bcrypt.hashSync(verificationCode, 10);

    const newUser = new User({
      username,
      email,
      uid: uuidv4(),
      authentication: {
        salt,
        password: hashedPassword,
      },
      address: addressArray,
      phone,
      userType,
      profile,
      profilePicture,
      verificationToken: hashedVerificationToken,
      tokenExpiration: new Date(Date.now() + 3600 * 1000), // 1-hour expiration
    });

    const createUserEntity = async (
      userType: string,
      profile: string,
      profilePicture: string,
      address: string[],
    ) => {
      switch (userType) {
        case 'Supermarket':
          const newSupermarket = new Supermarket({
            name: profile,
            image: profilePicture || '',
            address: address.join(', ') || '',
          });
          return await newSupermarket.save();

        case 'Driver':
          const newDriver = new Driver({ name: profile });
          return await newDriver.save();

        case 'Client':
          const newClient = new Client({ name: profile });
          return await newClient.save();

        case 'Picker':
          const newPicker = new Picker({ name: profile });
          return await newPicker.save();

        case 'Admin':
          const newAdmin = new Admin({ name: profile });
          return await newAdmin.save();

        default:
          return null;
      }
    };

    try {
      const savedEntity = await createUserEntity(
        userType,
        profile,
        profilePicture,
        addressArray,
      );

      if (savedEntity) {
        const savedEntityId = savedEntity._id as mongoose.Types.ObjectId;
        switch (userType.toLowerCase()) {
          case 'driver':
            newUser.driverId = savedEntityId;
            break;
          case 'client':
            newUser.clientId = savedEntityId;
            break;
          case 'picker':
            newUser.pickerId = savedEntityId;
            break;
          case 'admin':
            newUser.adminId = savedEntityId;
            break;
          case 'supermarket':
            newUser.supermarketId = savedEntityId;
            break;
        }
      }
    } catch (entityError) {
      console.error('Error creating user entity:', entityError);
      res.status(500).json({ message: 'Failed to create user entity' });
      return;
    }

    await newUser.save();

    try {
      await sendMail({
        email,
        subject: 'Email Verification',
        body: `Your verification code is: ${verificationCode}`,
        successMessage: 'Verification email sent successfully.',
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      res.status(201).json({
        success: true,
        message:
          'Registration successful, but we couldn’t send the verification email. Please contact support.',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message:
        'Registration successful. Please check your email to verify your account.',
    });
  } catch (error: unknown) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

