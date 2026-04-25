import express from 'express';
import { ReviewController } from './review.contller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';


const router = express.Router();

router.post('/', auth(), ReviewController.createReview);

router.get('/', ReviewController.getAllReviews);

router.get('/professional/:professionalId', auth(), ReviewController.getReviewsByProfessional);

router.get('/my-reviews', auth(), ReviewController.getMyReviews);

router.get('/:id', auth(), ReviewController.getReviewById);

router.patch('/:id', auth(), ReviewController.updateReview);

router.delete('/:id', auth(), ReviewController.deleteReview);

export const reviewRoute = router;
