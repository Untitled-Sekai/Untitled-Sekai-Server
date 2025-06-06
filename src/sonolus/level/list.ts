import { sonolus } from "../../index.js";
import { getFormattedLevels } from "./load.js";
import { searches } from "./search.js";
import { isValidSession, getProfile } from "../auth/state.js";
import { fetchAndFormatLevels } from "./load.js";

import { paginateItems } from "@sonolus/express";
import { raw } from "express";

export const list_level = () => {
    sonolus.level.listHandler = async (query) => {
        const formattedLevels = await getFormattedLevels();
        const options = query.search.options as any;

        // private charts
        if (query.session && isValidSession(query.session) &&
            (options.private === true || options.private === 'true' || options.private === '1' || options.private == 1)) {
            const profile = getProfile(query.session);

            const { privateLevels } = await fetchAndFormatLevels();
            const filteredPrivateLevels = privateLevels.filter(level => {
                const authorId = level.author?.en?.split('#')[1];
                const profileId = profile?.handle;

                const isAuthor = authorId === profileId;
                const isCollaborator = level.meta?.collaboration?.members?.some(
                    member => String(member.handle) === String(profileId)
                );
                return isAuthor || isCollaborator;
            });
            return {
                items: filteredPrivateLevels,
                pageCount: query.page,
            }
        }

        let filteredLevels = [...formattedLevels];

        // title search
        if (options.title) {
            const titleQuery = String(options.title).toLowerCase();
            filteredLevels = filteredLevels.filter(level => {
                const title = level.title?.en?.toLowerCase() || '';
                console.log('titleQuery:', titleQuery, 'title:', title);
                return title.includes(titleQuery);
            });
        }

        // artist search 
        if (options.artists) {
            const artistQuery = String(options.artists).toLowerCase();
            filteredLevels = filteredLevels.filter(level => {
                const artist = level.artists?.en?.toLowerCase() || '';
                return artist.includes(artistQuery);
            });
        }

        // difficulty search
        if (options.difficulty) {
            let difficultyKeys: string[] = [];

            if (typeof options.difficulty === 'object' && !Array.isArray(options.difficulty)) {
                difficultyKeys = Object.entries(options.difficulty)
                    .filter(([_, value]) => value === true)
                    .map(([key, _]) => key);
            } else if (typeof options.difficulty === 'string') {
                difficultyKeys = options.difficulty.split(',');
            } else if (Array.isArray(options.difficulty)) {
                difficultyKeys = options.difficulty;
            } else {
                difficultyKeys = [options.difficulty];
            }

            const allDifficulties = ['other','append', 'master', 'expert', 'hard', 'normal', 'easy'];
            const isAllSelected = allDifficulties.every(d => difficultyKeys.includes(d));

            if (difficultyKeys.length > 0 && !isAllSelected) {
                filteredLevels = filteredLevels.filter(level =>
                    difficultyKeys.some(diff => {
                        // タグベースでの検索のみ使用
                        return level.tags && Array.isArray(level.tags) && level.tags.some(tag =>
                            (tag.title?.en || '').toLowerCase() === diff.toLowerCase() ||
                            (tag.title?.ja || '').toLowerCase() === diff.toLowerCase()
                        );
                    })
                );
            }
        }

        // minRating and maxRating search
        if (options.minRating) {
            const minRating = Number(options.minRating);
            filteredLevels = filteredLevels.filter(level => {
                const rating = Number(level.rating || 0);
                return !isNaN(rating) && rating >= minRating;
            });
        }

        if (options.maxRating) {
            const maxRating = Number(options.maxRating);
            filteredLevels = filteredLevels.filter(level => {
                const rating = Number(level.rating || 0);
                return !isNaN(rating) && rating <= maxRating;
            });
        }

        return {
            items: filteredLevels,
            pageCount: query.page,
        };
    };
}