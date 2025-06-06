// Sonolusを使った二段階認証
import { sonolus } from "../../index.js";
import { UserModel } from "../../models/user.js";
import { MESSAGE } from "../../message.js";

import { Request, Response } from "express";
import { RequestHandler } from "express";
import { Session } from "express-session";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface RequestWithSession extends Request {
    session: Session & {
        userId?: string;
        username?: string;
    }
}

interface UserProfile {
    handle: string;
    name: string;
}

interface AuthenticateExternalRequest {
    type: 'authenticateExternal';
    url: string;
    time: number;
    userProfile: UserProfile;
}

export const setupWebAuth = () => {
    sonolus.router.post('/api/sonolus/auth', (async (req: RequestWithSession, res: Response) => {
        const body = req.body as AuthenticateExternalRequest;

        try {

            if (body.type !== 'authenticateExternal') {
                return res.status(401).json({ message: "リクエストが無効です" });
            }

            const currenTime = Math.floor(Date.now() / 1000);
            const requestTime = Math.floor(body.time / 1000);

            if (Math.abs(currenTime - requestTime) > 60) {
                return res.status(401).json({ message: "リクエストの時間が無効です" });
            }

            const token = req.headers.authorization?.split(' ')[1] || req.query.token as string;
            if (!token) {
                return res.status(401).json({ message: "トークンが無効です" });
            }

            const secret = process.env.SECRET_KEY as string || 'your_jwt_secret';
            if (!secret) {
                return res.status(500).json({ message: "サーバーエラー" });
            }

            const decoded = jwt.verify(token, secret) as any;
            
            const updatedUser = await UserModel.findByIdAndUpdate(
                decoded.id,
                {
                    sonolusAuth: true,
                    sonolusProfile: body.userProfile
                },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(401).json({ message: "ユーザーが見つかりません" });
            }

            return res.json({message: MESSAGE.SUCCESS.SONOLUSAUTHENTICATED.MESSAGE.en,profile: updatedUser.sonolusProfile});
        } catch (error) {
            console.error(error);
            res.status(500).json(MESSAGE.ERROR.SERVERERROR);
        }

    }) as RequestHandler);
}