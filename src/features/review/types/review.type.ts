export type BookReview = {
  reviewId: number;
  bookId: number;
  memberId: number;
  memberName: string;
  rating: number;
  content: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookReviewStats = {
  bookId: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
};

export type CreateReviewPayload = {
  rating: number;
  content?: string;
};

export type UpdateReviewPayload = {
  rating: number;
  content?: string;
};
