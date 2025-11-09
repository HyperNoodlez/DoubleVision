import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "./index";
import { UserDocument } from "../types";

/**
 * Strike System Constants
 */
export const STRIKE_CONSTANTS = {
  MAX_STRIKES: 3, // Number of strikes before timeout
  TIMEOUT_DURATION_DAYS: 7, // 1 week timeout
};

/**
 * Add a strike to a user for rejected review
 */
export async function addStrike(userId: string): Promise<{
  strikes: number;
  isTimedOut: boolean;
  timeoutUntil?: Date;
}> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);

  // Convert string ID to ObjectId for MongoDB query
  const user = await collection.findOne({ _id: new ObjectId(userId) as any });

  if (!user) {
    throw new Error(`User not found with _id: ${userId}`);
  }

  // Check if timeout has expired - if so, reset strikes
  const now = new Date();
  if (user.strikeTimeout && user.strikeTimeout < now) {
    // Timeout expired, reset strikes
    await collection.updateOne(
      { _id: new ObjectId(userId) as any },
      {
        $set: {
          strikes: 1, // This rejection counts as first strike
          lastStrikeDate: now,
        },
        $unset: {
          strikeTimeout: "",
        },
      }
    );

    return {
      strikes: 1,
      isTimedOut: false,
    };
  }

  // If already timed out (timeout hasn't expired), don't add more strikes
  if (user.strikeTimeout && user.strikeTimeout >= now) {
    return {
      strikes: user.strikes || 0,
      isTimedOut: true,
      timeoutUntil: user.strikeTimeout,
    };
  }

  // Add a strike
  const newStrikes = (user.strikes || 0) + 1;
  const updates: any = {
    strikes: newStrikes,
    lastStrikeDate: now,
  };

  // If reached max strikes, set timeout
  if (newStrikes >= STRIKE_CONSTANTS.MAX_STRIKES) {
    const timeoutUntil = new Date();
    timeoutUntil.setDate(timeoutUntil.getDate() + STRIKE_CONSTANTS.TIMEOUT_DURATION_DAYS);
    updates.strikeTimeout = timeoutUntil;

    await collection.updateOne(
      { _id: new ObjectId(userId) as any },
      { $set: updates }
    );

    console.log(`⛔ User ${userId} timed out until ${timeoutUntil.toISOString()} (${newStrikes} strikes)`);

    return {
      strikes: newStrikes,
      isTimedOut: true,
      timeoutUntil,
    };
  }

  // Update strikes (not yet timed out)
  await collection.updateOne(
    { _id: new ObjectId(userId) as any },
    { $set: updates }
  );

  console.log(`⚠️ User ${userId} received strike ${newStrikes}/${STRIKE_CONSTANTS.MAX_STRIKES}`);

  return {
    strikes: newStrikes,
    isTimedOut: false,
  };
}

/**
 * Check if user is currently timed out
 */
export async function isUserTimedOut(userId: string): Promise<{
  isTimedOut: boolean;
  timeoutUntil?: Date;
  strikes: number;
}> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);

  const user = await collection.findOne({ _id: new ObjectId(userId) as any });

  if (!user) {
    return {
      isTimedOut: false,
      strikes: 0,
    };
  }

  const now = new Date();

  // Check if timeout has expired
  if (user.strikeTimeout && user.strikeTimeout < now) {
    // Timeout expired, reset strikes automatically
    await collection.updateOne(
      { _id: new ObjectId(userId) as any },
      {
        $set: {
          strikes: 0,
        },
        $unset: {
          lastStrikeDate: "",
          strikeTimeout: "",
        },
      }
    );

    return {
      isTimedOut: false,
      strikes: 0,
    };
  }

  // Check if currently timed out
  if (user.strikeTimeout && user.strikeTimeout >= now) {
    return {
      isTimedOut: true,
      timeoutUntil: user.strikeTimeout,
      strikes: user.strikes || 0,
    };
  }

  return {
    isTimedOut: false,
    strikes: user.strikes || 0,
  };
}

/**
 * Get user's strike information
 */
export async function getUserStrikes(userId: string): Promise<{
  strikes: number;
  isTimedOut: boolean;
  timeoutUntil?: Date;
  lastStrikeDate?: Date;
}> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);

  const user = await collection.findOne({ _id: new ObjectId(userId) as any });

  if (!user) {
    return {
      strikes: 0,
      isTimedOut: false,
    };
  }

  const now = new Date();

  // Check if timeout expired
  if (user.strikeTimeout && user.strikeTimeout < now) {
    return {
      strikes: 0,
      isTimedOut: false,
    };
  }

  return {
    strikes: user.strikes || 0,
    isTimedOut: !!(user.strikeTimeout && user.strikeTimeout >= now),
    timeoutUntil: user.strikeTimeout,
    lastStrikeDate: user.lastStrikeDate,
  };
}

/**
 * Reset a user's strikes (admin function)
 */
export async function resetStrikes(userId: string): Promise<void> {
  const collection = await getCollection<UserDocument>(COLLECTIONS.USERS);

  await collection.updateOne(
    { _id: new ObjectId(userId) as any },
    {
      $set: {
        strikes: 0,
      },
      $unset: {
        strikeTimeout: "",
        lastStrikeDate: "",
      },
    }
  );

  console.log(`✅ Reset strikes for user ${userId}`);
}
