import { sonolus } from "../../index.js";
import { getFormattedLevels } from "./load.js";
import { searches } from "./search.js";
import { isValidSession, getProfile } from "../auth/state.js";
import { fetchAndFormatLevels } from "./load.js";
import { fetchLevels_public } from "../../db/fetch/level.js";
import { LevelModel } from "../../models/level.js";
import { LevelItemModel } from "@sonolus/express";

import { paginateItems } from "@sonolus/express";
import { raw } from "express";

export const list_level = () => {
    sonolus.level.listHandler = async ({ search: { type, options }, page, session }) => {
        const levels = await fetchLevels_public();


        if (type === 'quick') {
            return {
                ...paginateItems(levels, page),
                searches: searches,
            };
        }

        let items = levels.filter(level => {
            return level.name.toLowerCase().includes(options.keywords.toLowerCase());
        });

        // ランダム処理

        if (options.random) {
            items.sort(() => Math.random() - 0.5);
        }

        const isPrivate = options.private === true;
        const validSession = session && isValidSession(session);

        if (validSession && isPrivate) {
            const profile = getProfile(session);
            const profileId = profile?.handle;

            if (profileId) {
                const allLevels = await LevelModel.find({ "meta.isPublic": false }).lean();

                items = allLevels.filter(level => {
                    const authorId = level.author?.en?.split('#')[1];
                    const isAuthor = authorId === String(profileId);

                    const isCollaborator = level.meta?.collaboration?.members?.some(
                        member => String(member.handle) === String(profileId)
                    );

                    const isPrivateShare = level.meta?.privateShare?.users?.some(
                        user => String(user.handle) === String(profileId)
                    );

                    const isAnonymous = String(level.meta?.anonymous?.original_handle) === String(profileId);

                    return isAuthor || isCollaborator || isPrivateShare || isAnonymous;
                }).map(doc => {
                    const { _id, __v, createdAt, ...levelData } = doc;
                    return levelData as unknown as LevelItemModel;
                });

                if (options.keywords) {
                    items = items.filter(level =>
                        level.name.toLowerCase().includes(options.keywords.toLowerCase()) ||
                        level.title?.en?.toLowerCase().includes(options.keywords.toLowerCase()) ||
                        level.title?.ja?.toLowerCase().includes(options.keywords.toLowerCase()) ||
                        level.artists?.en?.toLowerCase().includes(options.keywords.toLowerCase()) ||
                        level.artists?.ja?.toLowerCase().includes(options.keywords.toLowerCase()) ||
                        level.author?.en?.toLowerCase().includes(options.keywords.toLowerCase()) ||
                        level.author?.ja?.toLowerCase().includes(options.keywords.toLowerCase())
                    );
                }
            }
        }

        return {
            ...paginateItems(items, page),
            searches: searches,
        };
    };
}