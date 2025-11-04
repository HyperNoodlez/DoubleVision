/**
 * Simple MongoDB connection test
 * Run with: node test-mongodb.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    console.log('\nMake sure you have a .env.local file with:');
    console.log('MONGODB_URI=mongodb+srv://...\n');
    process.exit(1);
  }

  console.log('📝 Connection string found');
  console.log(`   Database URI: ${process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')}\n`);

  let client;

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    console.log('✅ Successfully connected to MongoDB Atlas!\n');

    // Test database access
    const db = client.db('doublevision');
    console.log('📊 Testing database access...');

    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`✅ Database "doublevision" is accessible`);
    console.log(`   Collections found: ${collections.length || 0}\n`);

    // Test write operation
    console.log('✍️  Testing write operation...');
    const testCollection = db.collection('connection_test');
    await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('✅ Write operation successful\n');

    // Test read operation
    console.log('📖 Testing read operation...');
    const testDoc = await testCollection.findOne({ test: true });
    console.log('✅ Read operation successful\n');

    // Cleanup
    await testCollection.deleteOne({ test: true });
    console.log('🧹 Cleaned up test data\n');

    console.log('═══════════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════');
    console.log('\nYour MongoDB Atlas setup is complete and working!\n');
    console.log('Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. The database indexes will be created automatically');
    console.log('3. Continue with OAuth setup\n');

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error details:', error.message);
    console.log('\nCommon issues:');
    console.log('1. Check your password is correct (no special characters need encoding)');
    console.log('2. Verify IP address is whitelisted in Network Access');
    console.log('3. Make sure cluster is active (not paused)');
    console.log('4. Check the database name in the connection string\n');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔒 Connection closed\n');
    }
  }
}

testConnection();
