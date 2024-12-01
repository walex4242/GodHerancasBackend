import express from 'express';
import {
  deleteSupermarket,
  addSupermarket,
  getRandomSupermarkets,
  getSupermarket,
  getAllSupermarkets,
} from '../controller/supermarketController';
import { isAuthenticated, isOwner, isSupermarketOwner } from '../middlewares';
import { upload } from '../middlewares/upload';
import { verifyJWT } from '../middlewares/authenticateJWT';

export default (router: express.Router) => {
  router.get('/supermarket/:id', getSupermarket);
  router.post(
    '/supermarket',
    verifyJWT,
    isSupermarketOwner,
    upload.single('image'),
    addSupermarket,
  );
  router.get('/supermarket/random', getRandomSupermarkets);
  router.delete(
    '/supermarkets/:id',
    verifyJWT,
    isSupermarketOwner,
    deleteSupermarket,
  );
  router.get('/supermarket', getAllSupermarkets);
};
