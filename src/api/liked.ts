// なぜかSonolus.routerでうまくいかなかったので、直接routerを使う

import { sonolus } from "../index.js";
import { RequestHandler } from "express";
import { UserModel } from "../models/user.js";
import { LevelModel } from "../models/level.js";
import { getProfile, isValidSession } from "../sonolus/auth/state.js";
import { MESSAGE } from "../message.js";
import express from "express";

export const likeRouter = express.Router();


likeRouter.post('/sonolus/levels/:levelId/submit', (async (req, res) => {
    console.log('likeLevel');
    try {
        const session = req.header('Sonolus-session');

        if (!session || !isValidSession(session)) {
            return res.status(401).json(MESSAGE.ERROR.UNAUTHORIZED);
        }

        const profile = getProfile(session);

        if (!profile) {
            return res.status(401).json(MESSAGE.ERROR.UNAUTHORIZED);
        }

        const userhandle = profile.handle;
        const levelId = req.params.levelId;
        console.log('levelId:', levelId);

        const user = await UserModel.findOne({ "sonolusProfile.handle": userhandle });
        if (!user) {
            return res.status(404).json({ error: 'ユーザーが見つかりません' });
        }

        const level = await LevelModel.findOne({ name: levelId });
        if (!level) {
            return res.status(404).json({ error: 'レベルが見つかりません' });
        }

        const heartTagIndex = level.tags.findIndex(tag => tag.icon === 'heart');
        let isLiking = false;

        if (heartTagIndex !== -1 && level.tags[heartTagIndex]?.title?.en) {
            const currentCount = parseInt(level.tags[heartTagIndex].title.en || "0");

            const hasLiked = user.likedCharts && levelId ? user.likedCharts.includes(levelId) : false;

            if (!hasLiked && levelId) {
                level.tags[heartTagIndex].title = {
                    en: String(currentCount + 1),
                    ja: String(currentCount + 1)
                };

                if (!Array.isArray(user.likedCharts)) {
                    user.likedCharts = [];
                }
                user.likedCharts.unshift(levelId);
                isLiking = true;
            } else {
                level.tags[heartTagIndex].title = {
                    en: String(Math.max(0, currentCount - 1)),
                    ja: String(Math.max(0, currentCount - 1))
                };

                user.likedCharts = user.likedCharts.filter(id => id !== levelId);
                isLiking = false;
            }

            await user.save();
            await level.save();

            const levelIndex = sonolus.level.items.findIndex(item => item.name === levelId);
            if (levelIndex !== -1 && sonolus.level.items[levelIndex]?.tags?.[heartTagIndex]) {
                const heartCount = level.tags[heartTagIndex]?.title?.en || "0";
                sonolus.level.items[levelIndex].tags[heartTagIndex].title = {
                    en: heartCount,
                    ja: heartCount
                };
            }

            return res.status(200).json({
                key: "",
                hashes: [],
                shouldUpdateItem: true,
                isLiking: isLiking
            });
        } else {
            return res.status(404).json({ error: 'タグが見つかりません' });
        }
    } catch (e) {
        console.error('error:', e);
        res.status(500).json(MESSAGE.ERROR.SERVERERROR);
    }
}) as RequestHandler);

export default likeRouter;