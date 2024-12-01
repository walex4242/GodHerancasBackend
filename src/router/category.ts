import express from 'express';
import {  isCategoryOwner } from '../middlewares';
import { fileUpload, upload } from '../middlewares/upload';
import {
  getCategory,
  getAllCategory,
  deleteCategory,
  updateCategory,
  createCategory,
  getCategoryBySupermarket,
} from '../controller/categoryController';
import { verifyJWT } from '../middlewares/authenticateJWT';

export default (router: express.Router) => {
  router.post(
    '/category/:id',
    verifyJWT, // Only check if the user is authenticated
    upload.single('image'), // Handle the image upload
    fileUpload,
    createCategory, // Handle the category creation
  );
  router.patch(
    '/category/:id',
    verifyJWT,
    isCategoryOwner,
    upload.single('image'),
    fileUpload,
    updateCategory,
  );
  router.delete('/category/:id', verifyJWT, isCategoryOwner, deleteCategory);
  router.get('/category/:id', getCategory);
  router.get('/category', getAllCategory);
  router.get(
    '/supermarket/:supermarketId/categories',
    getCategoryBySupermarket,
  );
};
