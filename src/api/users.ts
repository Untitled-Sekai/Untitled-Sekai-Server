import { UserModel } from "../models/user.js";
import { sonolus } from "../index.js"
import { isAuth } from "./middleware/isAuth.js";
import mongoose from "mongoose";

export const setupUserRoutes = () => {
    const authMiddleware = (req: any, res: any, next: any) => {
        isAuth(req, res, next);
    };

    sonolus.router.get('/api/me', authMiddleware, async (req: any, res: any) => {
        try {
            const user = await UserModel.findById(req.user._id).select('-password');

            if (!user) {
                return res.status(404).json({ message: "user is not found" });
            }

            res.json(user);
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    })

    sonolus.router.get('/api/users/:username', async (req: any, res: any) => {
        try {
            const { username } = req.params;

            const user = await UserModel.findOne({ username }).select('-password');

            if (!user) {
                return res.status(404).json({ message: "user is not found" });
            }

            res.json(user);
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    });

    sonolus.router.get('/api/users/id/:id', async (req: any, res: any) => {
        try {
            const { id } = req.params;

            const user = await UserModel.findById(id).select('-password');

            if (!user) {
                return res.status(404).json({ message: "user is not found" });
            }

            res.json(user);
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    });

    sonolus.router.get('/api/users/handle/:handle', async (req: any, res: any) => {
        try {
            const { handle } = req.params;

            // 数値と文字列の両方で検索
            const user = await UserModel.findOne({
                $or: [
                    { 'sonolusProfile.handle': Number(handle) },
                    { 'sonolusProfile.handle': handle.toString() }
                ]
            }).select('username userNumber profile sonolusProfile');

            if (!user) {
                console.log('ユーザー見つからなかった:', handle);
                return res.status(404).json({ message: "user is not found" });
            }

            res.json(user);
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    })

    sonolus.router.get('/api/users/search', async (req: any, res: any) => {
        try {
            const { query } = req.query;

            if (!query || query.length < 2) {
                return res.status(400).json({ message: "検索キーワードは2文字以上入れてください" });
            }

            const users = await UserModel.find({
                username: { $regex: query, $options: 'i' }
            }).select('username userNumber profile').limit(10);

            res.json(users);
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server errror" });
        }
    });

    sonolus.router.get('/api/follow-status/:username', authMiddleware, async (req: any, res: any) => {
        try {
            if(!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            if(!req.params.username) {
                return res.status(400).json({ message: "username is required" });
            }

            const { username } = req.params;
            const targetUser = await UserModel.findOne({ username});
            if (!targetUser) {
                return res.status(404).json({ message: "user is not found" });
            }

            if (req.user.username === username) {
                return res.json({ isFollowing: false, isSelf: true });
            }

            const isFollowing: boolean = req.user.following.some((id: mongoose.Types.ObjectId) => id.toString() === targetUser._id.toString());

            res.json({
                isFollowing,
                isSelf: false,
                followersCount: targetUser.followers.length,
                followingCount: targetUser.following.length
            });
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    })

    sonolus.router.post('/api/follow/:username', authMiddleware, async (req:any, res:any) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "ログインされていません。" });
            }

            const { username } = req.params;
            if (req.user.username === username) {
                return res.status(400).json({ message: "自分で自分をフォローすることはできません。" });
            }

            const targetUser = await UserModel.findOne({ username });

            if (!targetUser) {
                return res.status(404).json({ message: "ユーザーが見つかりません。" });
            }

            // フォロー関係のIDを型安全に扱うためのインターフェース
            interface FollowingCheck {
                id: mongoose.Types.ObjectId;
            }

            const isAlreadyFollowing: boolean = req.user.following.some(
                (id: mongoose.Types.ObjectId) => id.toString() === targetUser._id.toString()
            );

            if (isAlreadyFollowing) {
                return res.status(400).json({ message: "すでにフォローしています。" });
            }

            await UserModel.updateOne(
                { _id: req.user._id },
                { $addToSet: { following: targetUser._id } }
            );

            await UserModel.updateOne(
                { _id: targetUser._id },
                { $addToSet: { followers: req.user._id } }
            );

            res.json({ 
                success: true,
                message: "フォローが完了しました。",
                followersCount: targetUser.followers.length + 1
            });
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    })

    sonolus.router.delete('/api/follow/:username', authMiddleware, async (req:any, res:any) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: "ログインされていません。" });
            }

            const { username } = req.params;

            const targetUser = await UserModel.findOne({ username });

            if (!targetUser) {
                return res.status(404).json({ message: "ユーザーが見つかりません。" });
            }

            const isFollowing: boolean = req.user.following.some(
                (id: mongoose.Types.ObjectId) => id.toString() === targetUser._id.toString()
            );

            if (!isFollowing) {
                return res.status(400).json({ message: "フォローしていません。" });
            }

            await UserModel.updateOne(
                { _id: req.user._id },
                { $pull: { following: targetUser._id } }
            );

            await UserModel.updateOne(
                { _id: targetUser._id },
                { $pull: { followers: req.user._id } }
            );

            res.json({ 
                success: true,
                message: "フォロー解除が完了しました。",
                followersCount: targetUser.followers.length - 1
            });
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    })

    sonolus.router.post('/api/users/:username/ban', authMiddleware, async (req:any, res:any) => {
        try {
            if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
                return res.status(403).json({ message: "この操作をする権限がありません" });
            }

            const { username } = req.params;
            const { reason, isPermanent, timeoutDays } = req.body;

            if (!reason) {
                return res.status(400).json({ message: "理由を入力してください。" });
            }

            const targetUser = await UserModel.findOne({ username });
            if (!targetUser) {
                return res.status(404).json({ message: "ユーザーが存在しません。" });
            }

            if (targetUser.role === 'admin') {
                return res.status(403).json({ message: "このユーザーは管理者です。" });
            }

            if (isPermanent) {
                targetUser.isBanned = true;
                targetUser.banReason = reason;
                targetUser.bannedBy = req.user.username;
                targetUser.banDate = new Date();
                targetUser.timeoutUntil = new Date(0);
                targetUser.timeoutReason = "";
            } else if (timeoutDays && timeoutDays > 0) {
                const timeoutDate = new Date();
                timeoutDate.setDate(timeoutDate.getDate() + Number(timeoutDays));
                
                targetUser.timeoutUntil = timeoutDate;
                targetUser.timeoutReason = reason;
                targetUser.isBanned = false;
                targetUser.banReason = "";
            } else {
                return res.status(400).json({ message: "無効なタイムアウト期間です。" });
            }

            await targetUser.save();

            res.json({ 
                success: true, 
                message: isPermanent ? 
                    `${username}を永久BANしました。` : 
                    `${username}を${timeoutDays}日間タイムアウトしました。`
            });
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "Interval server error" });
        }
    })

    sonolus.router.post('/api/users/:username/unban', authMiddleware, async (req: any, res: any) => {
        try {
            // 管理者権限チェック
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: "この操作は管理者しかできないよ！" });
            }
    
            const { username } = req.params;
            
            // 対象ユーザーを検索
            const targetUser = await UserModel.findOne({ username });
    
            if (!targetUser) {
                return res.status(404).json({ message: "ユーザーが見つからないよ！" });
            }
    
            // BAN状態を解除
            targetUser.isBanned = false;
            targetUser.banReason = "";
            targetUser.bannedBy = "";
            targetUser.banDate = new Date(0);
            targetUser.timeoutUntil = new Date(0);
            targetUser.timeoutReason = "";
            
            await targetUser.save();
            
            res.json({ 
                success: true, 
                message: `${username}のBANを解除しました。`
            });
            
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "サーバーエラー" });
        }
    });

    sonolus.router.get('/api/users/:username/banstatus', authMiddleware, async (req: any, res: any) => {
        try {
            // 権限チェック
            if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
                return res.status(403).json({ message: "この情報は見れません。" });
            }
    
            const { username } = req.params;
            
            // 対象ユーザーを検索
            const targetUser = await UserModel.findOne({ username }).select('isBanned banReason bannedBy banDate timeoutUntil timeoutReason');
    
            if (!targetUser) {
                return res.status(404).json({ message: "ユーザーが見つかりません。" });
            }
            
            res.json(targetUser);
            
        } catch (e) {
            console.error("error:", e);
            res.status(500).json({ message: "サーバーエラー" });
        }
    });
}

export const getUser = setupUserRoutes;