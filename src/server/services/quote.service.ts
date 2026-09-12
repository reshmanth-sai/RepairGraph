import { prisma } from '../db';
import { AppError } from '../errors/AppError';
import { CreateQuoteInput, UpdateQuoteStatusInput } from '../validators/quote.validator';
import { UserRole, QuoteStatus, RequestStatus, JobStatus } from '@prisma/client';
import { getOrCreateRepairerProfile } from './repairer.service';

export async function createQuote(
  repairRequestId: string,
  userId: string,
  input: CreateQuoteInput
) {
  // 1. Verify user is a registered REPAIRER with an active profile
  const repairer = await getOrCreateRepairerProfile(userId);

  if (!repairer) {
    throw AppError.forbidden(
      'You must have an active Repairer profile to submit quotes.'
    );
  }

  // 2. Verify target repair request exists and is in a quotable state
  const repairRequest = await prisma.repairRequest.findUnique({
    where: { id: repairRequestId },
  });

  if (!repairRequest) {
    throw AppError.notFound('Repair Request');
  }

  if (repairRequest.status === RequestStatus.COMPLETED || repairRequest.status === RequestStatus.CANCELLED) {
    throw AppError.badRequest('Cannot submit quotes for a completed or cancelled repair request.');
  }

  // Prevent user from quoting their own device
  if (repairRequest.userId === userId) {
    throw AppError.badRequest('You cannot submit a quote for your own repair request.');
  }

  // Prevent duplicate active quotes from the same repairer for this request
  const existingQuote = await prisma.quote.findFirst({
    where: {
      repairRequestId,
      repairerId: repairer.id,
      status: { in: [QuoteStatus.PENDING, QuoteStatus.ACCEPTED] },
    },
  });

  if (existingQuote) {
    throw AppError.conflict('You have already submitted an active quote for this repair request.');
  }

  return prisma.quote.create({
    data: {
      repairRequestId,
      repairerId: repairer.id,
      estimatedCost: input.estimatedCost,
      estimatedDays: input.estimatedDays,
      notes: input.notes,
      status: QuoteStatus.PENDING,
    },
    include: {
      repairer: {
        select: {
          id: true,
          businessName: true,
          rating: true,
          address: true,
        },
      },
    },
  });
}

export async function listQuotesForRequest(
  repairRequestId: string,
  userId: string,
  role: UserRole
) {
  const repairRequest = await prisma.repairRequest.findUnique({
    where: { id: repairRequestId },
  });

  if (!repairRequest) {
    throw AppError.notFound('Repair Request');
  }

  // Request owner or admin can see all quotes for this request.
  // A repairer can only see their own quotes for this request.
  let repairerIdFilter: string | undefined = undefined;
  if (role === UserRole.REPAIRER && repairRequest.userId !== userId) {
    const repairer = await getOrCreateRepairerProfile(userId);
    if (!repairer) throw AppError.forbidden();
    repairerIdFilter = repairer.id;
  } else if (role === UserRole.USER && repairRequest.userId !== userId) {
    throw AppError.forbidden('You can only view quotes for your own repair requests.');
  }

  return prisma.quote.findMany({
    where: {
      repairRequestId,
      ...(repairerIdFilter ? { repairerId: repairerIdFilter } : {}),
    },
    include: {
      repairer: {
        select: {
          id: true,
          businessName: true,
          rating: true,
          totalJobs: true,
          address: true,
          verificationStatus: true,
        },
      },
    },
    orderBy: { estimatedCost: 'asc' },
  });
}

export async function updateQuoteStatus(
  quoteId: string,
  userId: string,
  role: UserRole,
  input: UpdateQuoteStatusInput
) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      repairRequest: true,
      repairer: true,
    },
  });

  if (!quote) {
    throw AppError.notFound('Quote');
  }

  const isCustomer = quote.repairRequest.userId === userId;
  const isQuoteRepairer = quote.repairer.userId === userId;

  // Rule 1: Customer can accept or reject
  if (input.status === QuoteStatus.ACCEPTED || input.status === QuoteStatus.REJECTED) {
    if (!isCustomer && role !== UserRole.ADMIN) {
      throw AppError.forbidden('Only the customer who owns this repair request can accept or reject quotes.');
    }

    if (input.status === QuoteStatus.ACCEPTED) {
      // Transaction to accept quote, reject others, update request status, and create repair job
      return prisma.$transaction(async (tx) => {
        // Mark chosen quote as accepted
        const acceptedQuote = await tx.quote.update({
          where: { id: quoteId },
          data: { status: QuoteStatus.ACCEPTED, notes: input.notes },
        });

        // Mark other quotes for this request as rejected
        await tx.quote.updateMany({
          where: {
            repairRequestId: quote.repairRequestId,
            id: { not: quoteId },
            status: QuoteStatus.PENDING,
          },
          data: { status: QuoteStatus.REJECTED },
        });

        // Update repair request status
        await tx.repairRequest.update({
          where: { id: quote.repairRequestId },
          data: { status: RequestStatus.ACCEPTED },
        });

        // Create the active repair job
        await tx.repairJob.create({
          data: {
            repairRequestId: quote.repairRequestId,
            repairerId: quote.repairerId,
            quoteId: quote.id,
            status: JobStatus.ACCEPTED,
            agreedCost: quote.estimatedCost,
            startedAt: new Date(),
          },
        });

        return acceptedQuote;
      });
    }

    // Rejected by customer
    return prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.REJECTED, notes: input.notes },
    });
  }

  // Rule 2: Repairer can withdraw their own quote
  if (input.status === QuoteStatus.WITHDRAWN) {
    if (!isQuoteRepairer && role !== UserRole.ADMIN) {
      throw AppError.forbidden('Only the repairer who submitted this quote can withdraw it.');
    }

    if (quote.status === QuoteStatus.ACCEPTED) {
      throw AppError.badRequest('Cannot withdraw a quote that has already been accepted.');
    }

    return prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.WITHDRAWN, notes: input.notes },
    });
  }

  throw AppError.badRequest('Invalid status transition requested.');
}

export async function deleteQuote(quoteId: string, userId: string, role: UserRole) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { repairer: true },
  });

  if (!quote) {
    throw AppError.notFound('Quote');
  }

  if (role !== UserRole.ADMIN && quote.repairer.userId !== userId) {
    throw AppError.forbidden('You can only delete your own quotes.');
  }

  if (quote.status === QuoteStatus.ACCEPTED) {
    throw AppError.badRequest('Cannot delete an accepted quote.');
  }

  await prisma.quote.delete({ where: { id: quoteId } });
  return { success: true, message: 'Quote deleted successfully' };
}
