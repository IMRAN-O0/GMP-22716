import { Router } from 'express';
import apiRouter from './server/api.js';

console.log(apiRouter.stack.map(l => l.route?.path));
