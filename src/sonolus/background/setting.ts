import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.CONVERT_PORT || 6003;