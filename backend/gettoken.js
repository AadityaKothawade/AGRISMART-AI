import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

dotenv.config();

async function getTestToken() {
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY is missing in .env file');
    return;
  }

  const clerkClient = createClerkClient({ 
    secretKey: process.env.CLERK_SECRET_KEY 
  });

  try {
    // Get first user from Clerk (you need at least one user)
    const users = await clerkClient.users.getUserList({ limit: 1 });
    
    if (!users.data || users.data.length === 0) {
      console.log('⚠️ No users found in Clerk. Please create a test user first.');
      console.log('👉 Go to Clerk Dashboard → Users → Add user');
      return;
    }

    const userId = users.data[0].id;
    console.log(`👤 Using user: ${userId}`);

    // Generate a testing token (valid for 1 hour)
    const { token } = await clerkClient.testingTokens.createTestingToken({ 
      userId 
    });

    console.log('\n✅ Bearer Token (copy this):\n');
    console.log(token);
    console.log('\n📌 Use in Postman: Authorization → Bearer Token');
    
  } catch (error) {
    console.error('❌ Error generating token:', error.message);
    if (error.message.includes('testingTokens')) {
      console.log('\n💡 Tip: Testing tokens are only available in Development instances.');
      console.log('Make sure your Clerk instance is in Development mode, not Production.');
    }
  }
}

getTestToken();