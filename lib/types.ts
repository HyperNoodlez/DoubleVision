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
}

export interface PhotoDocument {
  _id: string;
  userId: string;
  imageUrl: string;
  uploadDate: Date;
  reviewsReceived: number;
  averageScore?: number;
  status: "pending" | "reviewed" | "archived";
}

export interface ReviewDocument {
  _id: string;
  photoId: string;
  reviewerId: string;
  score: number;
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
}

export interface ReviewAssignmentDocument {
  _id: string;
  userId: string;
  photoId: string;
  completed: boolean;
  assignedAt: Date;
  completedAt?: Date;
}
