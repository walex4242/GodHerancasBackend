import express from 'express';
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getUserOnly,
  updatePassword,
} from '../controller/usersController';
import { isOwner } from '../middlewares';
import { fileUpload, upload } from '../middlewares/upload';
import { verifyJWT } from '../middlewares/authenticateJWT';
import bodyParser from 'body-parser';

export default (router: express.Router) => {
  router.get('/users', verifyJWT, getAllUsers);
  router.delete('/users/:id', verifyJWT, isOwner, deleteUser);
  router.patch(
    '/users/:id',
    verifyJWT,
    isOwner,
    upload.single('profilePicture'),
    fileUpload,
    updateUser,
  );
  router.patch(
    '/users/:id/password',
    verifyJWT,
    isOwner,
    updatePassword,
  );
  router.get('/users/:id', verifyJWT,isOwner, getUserOnly);
};
