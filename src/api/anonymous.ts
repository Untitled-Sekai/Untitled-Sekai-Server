import { sonolus } from "../index.js";
import { UserModel } from "../models/user.js";
import { isAuth } from "./middleware/isAuth.js";
import { MESSAGE } from "../message.js";
import { auth } from "../auth/index.js";

const authMiddleware = (req: any, res: any, next: any) => {
    isAuth(req, res, next)
}

export const register_anonymousID_API = () => {
    sonolus.router.post('/api/register/anonymous', authMiddleware, async (req: any, res: any) => {
        try {
            const userId = req.user.id;
            const { name } = req.body;

            if (!name) {
                return res.status(400).json(MESSAGE.ERROR.NOTFOUND);
            }

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json(MESSAGE.ERROR.NOTFOUND);
            }

            if (!user.sonolusAuth) {
                return res.status(403).json({ message: 'Sonolus認証が必要です' });
            }

            const allUsers = await UserModel.find();
            let maxSubAccountNumber = 0;

            allUsers.forEach(u => {
                if (u.anonymousaccount && u.anonymousaccount.length > 0) {
                    u.anonymousaccount.forEach(sub => {
                        const match = sub.id.match(/#a(\d+)/);
                        if (match) {
                            const num = parseInt(match[1]);
                            if (num > maxSubAccountNumber) {
                                maxSubAccountNumber = num;
                            }
                        }
                    });
                }
            });

            const nextNumber = maxSubAccountNumber + 1;
            const identifier = `#a${nextNumber.toString().padStart(4, '0')}`;

            user.anonymousaccount.unshift({
                name,
                id: identifier,
                createdAt: new Date()
            });

            await user.save();
            res.status(201).json({
                success: true,
                message: "副名義が登録されました",
                identifier
            });
        } catch (e) {
            console.error("Anonymous ID registration error:", e);
            return res.status(500).json({ error: "An error occurred while registering the anonymous ID." });
        }
    })
}

export const get_anonymousID_API = () => {
    sonolus.router.get('/api/anonymous', authMiddleware, async (req: any, res: any) => {
        try {
            const userId = req.user.id;

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json(MESSAGE.ERROR.NOTFOUND);
            }

            res.json({ anonymousaccount: user.anonymousaccount });
        } catch (e) {
            console.error("Anonymous ID retrieval error:", e);
            return res.status(500).json({ error: "An error occurred while retrieving anonymous IDs." });
        }
    })
}

export const delete_anonymousID_API = () => {
    sonolus.router.delete('/api/anonymous/:id', authMiddleware, async (req: any, res: any) => {
        try {
            const userId = req.user.id;
            const id = decodeURIComponent(req.params.id);

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json(MESSAGE.ERROR.NOTFOUND);
            }

            const index = user.anonymousaccount.findIndex(acc => acc.id === id);
            if (index !== -1) {
                user.anonymousaccount.splice(index, 1);
            } else {
                return res.status(404).json({ error: "指定されたIDの副名義が見つかりません。" });
            }

            await user.save();

            return res.status(200).json({ success: true, message: "副名義が削除されました" });
        } catch (e) {
            console.error("Anonymous ID deletion error:", e);
            return res.status(500).json({ error: "An error occurred while deleting the anonymous ID." });
        }
    })
}

export const anonymous = () => {
    register_anonymousID_API();
    get_anonymousID_API();
    delete_anonymousID_API();
}