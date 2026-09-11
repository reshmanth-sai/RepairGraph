import { prisma } from '../db';
import { AppError } from '../errors/AppError';
import { CreateReviewInput, UpdateReviewInput } from '../validators/review.validator';
import { PaginationParams } from '../utils/pagination';
import { JobStatus, UserRole } from '@prisma/client';

export async function createReview(userId: string, input: CreateReviewInput) {
  // 1. Fetch the target repair job
  const job = await prisma.repairJob.findUnique({
    where: { id: input.repairJobId },
    include: {
      repairRequest: true,
      review: true,
    },
  });

  if (!job) {
    throw AppError.notFound('Repair Job');
  }

  // 2. Rule: Job must be completed
  if (job.status !== JobStatus.COMPLETED) {
    throw AppError.badRequest('Reviews can only be submitted for completed repair jobs.');
  }

  // 3. Rule: User must be the customer who commissioned the repair
  if (job.repairRequest.userId !== userId) {
    throw AppError.forbidden('You can only review repair jobs for your own devices.');
  }

  // 4. Rule: Prevent duplicate review
  if (job.review) {
    throw AppError.conflict('A review has already been submitted for this repair job.');
  }

  // Transaction: Create review + update repairer's average rating
  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        repairJobId: input.repairJobId,
        userId,
        repairerId: job.repairerId,
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Recalculate average rating for repairer
    const aggregates = await tx.review.aggregate({
      where: { repairerId: job.repairerId },
      _avg: { rating: true },
    });

    const newAverage = aggregates._avg.rating || input.rating;

    await tx.repairer.update({
      where: { id: job.repairerId },
      data: { rating: Math.round(newAverage * 10) / 10 },
    });

    return review;
  });
}

export async function listReviewsForRepairer(repairerId: string, pagination: PaginationParams) {
  const where = { repairerId };

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    reviews,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1,
  };
}

export async function updateReview(
  reviewId: string,
  userId: string,
  role: UserRole,
  input: UpdateReviewInput
) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw AppError.notFound('Review');
  }

  if (role !== UserRole.ADMIN && review.userId !== userId) {
    throw AppError.forbidden('You can only modify your own review.');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: {
        rating: input.rating,
        comment: input.comment,
      },
    });

    if (input.rating !== undefined) {
      const aggregates = await tx.review.aggregate({
        where: { repairerId: review.repairerId },
        _avg: { rating: true },
      });
      const newAverage = aggregates._avg.rating || input.rating;
      await tx.repairer.update({
        where: { id: review.repairerId },
        data: { rating: Math.round(newAverage * 10) / 10 },
      });
    }

    return updated;
  });
}

export async function deleteReview(reviewId: string, userId: string, role: UserRole) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw AppError.notFound('Review');
  }

  if (role !== UserRole.ADMIN && review.userId !== userId) {
    throw AppError.forbidden('You can only delete your own review.');
  }

  await prisma.review.delete({ where: { id: reviewId } });
  return { success: true, message: 'Review deleted successfully.' };
}
