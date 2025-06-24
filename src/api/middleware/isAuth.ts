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

export interface AuthRequest extends Request {
    user?: any;
}

export const isAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // デバッグ情報の詳細化
    console.log('--------- 認証デバッグ開始 ---------');
    console.log('リクエストパス:', req.path);
    console.log('認証ヘッダー:', req.headers['authorization']);
    console.log('Cookie:', req.headers['cookie']);

    const token = req.headers['authorization']?.split(' ')[1];
    console.log('抽出されたトークン:', token ? token.substring(0, 15) + '...' : 'なし');

    if (!token) {
        console.log('トークンが見つかりません。認証に失敗します。');
        return res.status(401).json({ message: 'token is not found' });
    }

    try {
        console.log('トークン検証を開始します...');
        const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as JwtPayload;
        console.log('デコードされたペイロード:', JSON.stringify({
            id: decoded.id,
            username: decoded.username,
            exp: new Date(decoded.exp * 1000).toISOString()
        }));

        console.log('ユーザーをデータベースから検索中...');
        // findByIdを使わずに直接findOneで検索
        const user = await UserModel.findOne({ _id: decoded.id });

        if (!user) {
            console.log(`ID ${decoded.id} のユーザーが見つかりません。データベースで確認してください。`);
            
            // MongoDB内のIDを確認（デバッグ用）
            const allIds = await UserModel.find().select('_id username').limit(5);
            console.log('データベース内のユーザーID例:', JSON.stringify(allIds));
            
            return res.status(401).json({ message: 'user is not found' });
        }

        console.log('ユーザーが見つかりました:', user.username);

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
        console.error('エラータイプ:', error.name);
        console.error('エラーメッセージ:', error.message);
        console.error('スタックトレース:', error.stack);

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

        // 検索方法を一本化し、ObjectIDと文字列の両方に対応
        let user = await UserModel.findOne({ _id: decoded.id });
        if (!user) {
            // より詳細なデバッグ情報
            console.error(`ユーザーID検索失敗: ${decoded.id}`);
            
            // ユーザー名で代替検索を試みる（テスト・緊急用）
            const userByName = await UserModel.findOne({ username: decoded.username });
            if (userByName) {
                console.log(`ID検索失敗だがユーザー名で見つかりました: ${decoded.username}, DB内ID: ${userByName._id}`);
            }
            
            throw new Error('ユーザーが見つかりません');
        }

        console.log(`ユーザー検索成功: ${user.username}, ID: ${user._id}`);

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