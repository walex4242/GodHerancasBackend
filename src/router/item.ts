import express from 'express';
import {
  addItem,
  getItemsById,
  getItemsBySupermarket,
  deleteItemsById,
  updateItemsById,
  getItemsByCategory,
} from '../controller/itemController';
import { upload, fileUpload } from '../middlewares/upload';
import {  isSupermarketOwner } from '../middlewares';
import { verifyJWT } from '../middlewares/authenticateJWT';

export default (router: express.Router) => {
  router.post(
    '/item/:id',
    verifyJWT,
    upload.single('imageUrl'),
    fileUpload,
    addItem,
  );
  router.get('/item/:id', getItemsById);
  router.patch(
    '/item/:id',
    verifyJWT,
    isSupermarketOwner,
    upload.single('imageUrl'),
    fileUpload,
    updateItemsById,
  );
  router.delete('/item/:id', verifyJWT, isSupermarketOwner, deleteItemsById);
  router.get('/supermarket/:supermarketId/items', getItemsBySupermarket);
  router.get('/category/:categoryId/items', getItemsByCategory);
};

