import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

dotenv.config();

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const userId = 'user_3AAXfTH8JAdB3HvtGQYgJQ9jRWV'; // Replace with your Clerk user ID

const { token } = await clerk.testingTokens.createTestingToken({ userId });

console.log(token);