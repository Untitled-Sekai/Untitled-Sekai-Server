import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../../models/user.js';
import dotenv from 'dotenv';
import { UserRole } from '../../models/type.js';

dotenv.config();

interface JwtPayload {
    id: string;
    username: string;
    user_number: number;
    iat: number;
    exp: number;
}

interface AuthRequest extends Request {
    user?: any;
}

export const isAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // console.log('ヘッダー受信:', req.headers); // デバッグ用
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'token is not found' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as JwtPayload;
        
        const user = await UserModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'user is not found' });
        }

        if (user.isBanned) {
            return res.status(403).json({
                banned: true,
                permanent: true,
                message: 'アカウントが永久BANされています',
                reason: user.banReason || '理由は記載されていません',
                bannedBy: user.bannedBy,
                banDate: user.banDate
            });
        }

        const now = new Date();
        if (user.timeoutUntil && new Date(user.timeoutUntil) > now) {
            // タイムアウト期間中
            const timeLeft = Math.ceil((new Date(user.timeoutUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            return res.status(403).json({
                banned: true,
                permanent: false,
                message: 'アカウントがタイムアウト中です',
                reason: user.timeoutReason || '理由は記載されていません',
                timeoutUntil: user.timeoutUntil,
                daysLeft: timeLeft
            });
        }

        if (user.timeoutUntil && new Date(user.timeoutUntil) <= now) {
            user.timeoutUntil = new Date(0);
            user.timeoutReason = "";
            await user.save();
        }

        req.user = user;
        next();
    } catch (error: any) {
        console.error('認証エラー詳細:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'ログイン期限が切れました。再度ログインしてください', 
                code: 'TOKEN_EXPIRED',
                expiredAt: error.expiredAt
            });
        }
        
        return res.status(401).json({ 
            message: 'トークンに問題があります', 
            code: 'INVALID_TOKEN' 
        });
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ 
            message: 'ユーザー情報がありません' 
        });
    }

    if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ 
            message: '管理者権限が必要です' 
        });
    }

    next();
};

export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as {
      id: string;
      username: string;
      user_number: number;
    };
    
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }
    
    if (user.isBanned) {
      throw new Error('アカウントがBANされています');
    }
    
    const now = new Date();
    if (user.timeoutUntil && new Date(user.timeoutUntil) > now) {
      throw new Error('アカウントがタイムアウト中です');
    }
    
    return user;
  } catch (error) {
    console.error('トークン検証エラー:', error);
    throw error;
  }
};