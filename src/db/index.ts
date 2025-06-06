// DBに接続するための関数
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const connectURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/TEST_DB';

export const connectDB = async () => {
  try {
    await mongoose.connect(connectURL);
    console.log('MongoDBに接続成功');
  } catch (error) {
    console.error('DBに接続できませんでした。', error);
    process.exit(1);
  }
};