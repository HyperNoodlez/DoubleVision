/**
 * Seed Test Data Script
 * Creates fake users, photos, and reviews for testing
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'doublevision';

// Test user data
const TEST_USERS = [
  { name: 'Alice Johnson', email: 'alice@test.com', eloRating: 1200 },
  { name: 'Bob Smith', email: 'bob@test.com', eloRating: 950 },
  { name: 'Carol Davis', email: 'carol@test.com', eloRating: 1450 },
  { name: 'David Wilson', email: 'david@test.com', eloRating: 1100 },
  { name: 'Eve Martinez', email: 'eve@test.com', eloRating: 1350 },
];

// Sample review comments
const POSITIVE_COMMENTS = [
  'Great composition! The lighting really brings out the subject beautifully. I love how you captured the moment with such clarity and emotion. The colors are vibrant and well-balanced.',
  'Excellent use of depth of field! The bokeh in the background really makes the subject pop. Your attention to detail shows in every aspect of this shot.',
  'Beautiful framing and perspective. The rule of thirds is applied perfectly here. This photo tells a wonderful story and draws the viewer in immediately.',
  'Stunning colors and contrast! The post-processing is subtle yet effective. You have a great eye for capturing decisive moments in the perfect light.',
  'Wonderful timing and execution. The sharpness is incredible and the subject is perfectly positioned. This is professional-quality work that stands out.',
];

const CONSTRUCTIVE_COMMENTS = [
  'Good effort! The composition could be improved by following the rule of thirds more closely. Consider adjusting the exposure slightly to bring out more details in the shadows.',
  'Interesting subject matter. I would suggest experimenting with different angles to add more depth. The lighting is decent but could be more dramatic with some adjustments.',
  'Nice try! The focus seems slightly off - make sure to use the center focus point for sharper results. Also consider the background elements and how they complement the subject.',
  'Decent shot overall. The colors feel a bit muted - try increasing the vibrance slightly in post-processing. The composition has potential but needs some refinement.',
  'Good start! Work on your framing to eliminate distracting elements from the edges. The exposure is okay but could benefit from some highlight recovery.',
];

async function createPlaceholderImage(filename) {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  // Create a simple SVG placeholder
  const colors = ['#6aaa64', '#c9b458', '#787c7e', '#538d4e', '#b59f3b'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="600" fill="${color}"/>
    <text x="400" y="300" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
      Test Photo
    </text>
    <text x="400" y="350" font-family="Arial" font-size="24" fill="white" text-anchor="middle" opacity="0.7">
      ${filename}
    </text>
  </svg>`;

  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, svg);

  return `/uploads/${filename}`;
}

async function seedData() {
  console.log('🌱 Starting to seed test data...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    await db.collection('users').deleteMany({ email: { $regex: '@test\\.com$' } });
    await db.collection('photos').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('reviewAssignments').deleteMany({});
    console.log('✅ Cleared old test data\n');

    // Create test users
    console.log('👥 Creating test users...');
    const userIds = [];

    for (const userData of TEST_USERS) {
      const user = {
        ...userData,
        provider: 'test',
        image: null,
        totalReviews: 0,
        photoCount: 0,
        joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        lastUpload: null,
      };

      const result = await db.collection('users').insertOne(user);
      userIds.push(result.insertedId);
      console.log(`  ✓ Created user: ${userData.name} (ELO: ${userData.eloRating})`);
    }
    console.log(`✅ Created ${userIds.length} test users\n`);

    // Create test photos (2-3 per user)
    console.log('📸 Creating test photos...');
    const photoIds = [];

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const numPhotos = 2 + Math.floor(Math.random() * 2); // 2-3 photos per user

      for (let j = 0; j < numPhotos; j++) {
        const filename = `test-${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.svg`;
        const imageUrl = await createPlaceholderImage(filename);

        const photo = {
          userId: userId,
          imageUrl: imageUrl,
          uploadDate: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random date in last 14 days
          reviewsReceived: 0,
          averageScore: null,
          status: 'pending',
        };

        const result = await db.collection('photos').insertOne(photo);
        photoIds.push(result.insertedId);
      }

      console.log(`  ✓ Created ${numPhotos} photos for user ${i + 1}`);

      // Update user photo count
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: { photoCount: numPhotos, lastUpload: new Date() } }
      );
    }
    console.log(`✅ Created ${photoIds.length} test photos\n`);

    // Create test reviews (3-5 reviews per photo)
    console.log('⭐ Creating test reviews...');
    let totalReviews = 0;

    for (const photoId of photoIds) {
      const photo = await db.collection('photos').findOne({ _id: photoId });
      const photoOwnerId = photo.userId;

      const numReviews = 3 + Math.floor(Math.random() * 3); // 3-5 reviews per photo
      const reviewerIds = userIds.filter(id => !id.equals(photoOwnerId)).slice(0, numReviews);

      let totalScore = 0;

      for (const reviewerId of reviewerIds) {
        const score = 3 + Math.floor(Math.random() * 3); // 3-5 stars
        const isPositive = score >= 4;
        const comments = isPositive ? POSITIVE_COMMENTS : CONSTRUCTIVE_COMMENTS;
        const comment = comments[Math.floor(Math.random() * comments.length)];

        const review = {
          photoId: photoId,
          reviewerId: reviewerId,
          score: score,
          comment: comment,
          wordCount: comment.split(/\s+/).length,
          moderationStatus: 'approved',
          aiAnalysis: {
            isOffensive: false,
            isAiGenerated: false,
            isRelevant: true,
            confidence: 85 + Math.floor(Math.random() * 15), // 85-100%
            reasoning: 'Legitimate, constructive photography feedback.',
          },
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last 7 days
        };

        await db.collection('reviews').insertOne(review);
        totalScore += score;
        totalReviews++;

        // Update reviewer's total review count
        await db.collection('users').updateOne(
          { _id: reviewerId },
          { $inc: { totalReviews: 1 } }
        );
      }

      // Update photo with review stats
      const averageScore = totalScore / reviewerIds.length;
      await db.collection('photos').updateOne(
        { _id: photoId },
        {
          $set: {
            reviewsReceived: reviewerIds.length,
            averageScore: Math.round(averageScore * 10) / 10,
            status: 'reviewed'
          }
        }
      );
    }
    console.log(`✅ Created ${totalReviews} test reviews\n`);

    // Print summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 TEST DATA SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════\n');

    console.log('Summary:');
    console.log(`  👥 Users: ${userIds.length}`);
    console.log(`  📸 Photos: ${photoIds.length}`);
    console.log(`  ⭐ Reviews: ${totalReviews}`);
    console.log(`  📁 Images: public/uploads/\n`);

    console.log('Test Users:');
    for (let i = 0; i < TEST_USERS.length; i++) {
      const user = TEST_USERS[i];
      const userDoc = await db.collection('users').findOne({ email: user.email });
      console.log(`  ${i + 1}. ${user.name}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     ELO Rating: ${user.eloRating}`);
      console.log(`     Photos: ${userDoc.photoCount}`);
      console.log(`     Reviews: ${userDoc.totalReviews}`);
    }

    console.log('\n💡 Next steps:');
    console.log('  1. Start your dev server: npm run dev');
    console.log('  2. Go to http://localhost:3000');
    console.log('  3. Sign in with Google (your real account)');
    console.log('  4. Browse photos, leave reviews, test features!');
    console.log('  5. Check the admin dashboard at /admin\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 Connection closed\n');
  }
}

seedData();
