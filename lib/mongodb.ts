import { MongoClient } from "mongodb";

// Get URI from environment - will be undefined during build, set at runtime
const uri = process.env.MONGODB_URI || "";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    if (!uri) {
      throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
    }
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  // Only validate and connect when actually running (not during build)
  if (uri) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  } else {
    // During build time, create a dummy promise that will fail if actually used
    clientPromise = Promise.reject(
      new Error('Invalid/Missing environment variable: "MONGODB_URI"')
    );
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
