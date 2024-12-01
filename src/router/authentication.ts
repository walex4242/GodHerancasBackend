import express from 'express';
import { login, register } from '../controller/authenticationController';

export default (router: express.Router) => {
  // Registration route
  router.post('/auth/register', register); // Controller function to handle registration

  // Login route - No need for verifyJWT here, as it’s for generating a token
  router.post('/auth/login', login); // Controller function to handle login
};
