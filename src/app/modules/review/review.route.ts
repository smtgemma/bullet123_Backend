import express from 'express';
import { ReviewController } from './review.contller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';


const router = express.Router();

router.post('/',auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER), ReviewController.createReview);


router.get('/', ReviewController.getAllReviews);


router.get('/:id',auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER), ReviewController.getReviewById);


router.patch('/:id', auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER),ReviewController.updateReview);


router.delete('/:id',auth(UserRole.ADMIN,UserRole.SUPER_ADMIN,UserRole.USER), ReviewController.deleteReview);

export const reviewRoute = router;
