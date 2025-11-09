import { DefaultSession } from "next-auth";

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    eloRating?: number;
    totalReviews?: number;
    photoCount?: number;
  }
}

// Database types
export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified?: Date;
  provider: "google" | "github" | "test";
  eloRating: number;
  totalReviews: number;
  photoCount: number;
  joinedAt: Date;
  lastUpload?: Date;
  strikes: number; // Number of moderation strikes (reset after timeout)
  strikeTimeout?: Date; // When timeout expires (null if not timed out)
  lastStrikeDate?: Date; // When the last strike was received
}

export interface PhotoDocument {
  _id: string;
  userId: string;
  imageUrl: string;
  uploadDate: Date;
  reviewsReceived: number;
  averageScore?: number;
  status: "pending" | "reviewed" | "archived";
  allReviewsRated?: boolean;
  reviewsRatedCount?: number;
}

export interface ReviewDocument {
  _id: string;
  photoId: string;
  reviewerId: string;
  score: number; // 0-100 point scale
  comment: string;
  wordCount: number;
  moderationStatus: "pending" | "approved" | "rejected";
  aiAnalysis: {
    isOffensive: boolean;
    isAiGenerated: boolean;
    isRelevant: boolean;
    confidence: number;
    reasoning: string;
  };
  createdAt: Date;
  helpfulnessScore?: number;
  helpfulnessCount?: number;
}

export interface ReviewAssignmentDocument {
  _id: string;
  userId: string;
  photoId: string;
  completed: boolean;
  assignedAt: Date;
  completedAt?: Date;
}

export interface ReviewRatingDocument {
  _id: string;
  reviewId: string;
  photoId: string;
  ratedBy: string;
  // Multi-dimensional ratings (1-5 scale for each)
  specificityScore: number; // How detailed and specific
  constructivenessScore: number; // How actionable and helpful
  relevanceScore: number; // How relevant to the photo
  overallQuality: number; // Calculated average of the three
  createdAt: Date;
}
