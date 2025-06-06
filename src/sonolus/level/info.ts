import { sonolus } from "../../index.js";
import { searches } from "./search.js";
import { Text, Icon } from "@sonolus/core";
import { getProfile, isValidSession } from "../auth/state.js";
import { fetchAndFormatLevels } from "./load.js";
import { EventModel } from "../../models/event.js";
import { LevelModel } from "../../models/level.js";
import { LevelItemModel } from "@sonolus/express";

async function getEventLevels() {
    const now = new Date();

    const activeEvents = await EventModel.find({
        startDate: { $lte: now },
        endDate: { $gte: now }
    });

    if (activeEvents.length === 0) {
        return [];
    }

    const levelNames = activeEvents.map(event => event.levelName);

    const eventLevels = await LevelModel.find({
        name: { $in: levelNames },
        'meta.isPublic': true
    });

    return eventLevels.map(level => level.toObject()) as unknown as LevelItemModel[];
}

export const info_level = () => {
    sonolus.level.infoHandler = async (query) => {
        const validSession = query.session && isValidSession(query.session);
        const profile = query.session ? getProfile(query.session) : null;

        sonolus.level.searches = searches;

        const { publicLevels, privateLevels } = await fetchAndFormatLevels();
        const eventLevels = await getEventLevels();
        return {
            searches,
            sections: [
                ...(validSession ? [{
                    title: { en: Text.Private, ja: Text.Private },
                    icon: Icon.Level,
                    itemType: "level" as const,
                    items: privateLevels.filter(level => {
                        const authorId = level.author?.en?.split('#')[1];
                        const profileId = profile?.handle;

                        const isAuthor = authorId === profileId;

                        const isCollaborator = level.meta?.collaboration?.members?.some(member => String(member.handle) === String(profileId));
                        const isPrivateShare = level.meta?.privateShare?.users?.some(user => String(user.handle) === String(profileId));
                        const isAnonymous = String(level.meta?.anonymous?.original_handle) === String(profileId);

                        return isAuthor || isCollaborator || isPrivateShare || isAnonymous;
                    }),
                }] : []),
                ...(eventLevels.length > 0 ? [{
                    title: { en: 'Limited Event', ja: '期間限定イベント' },
                    icon: Icon.Level,
                    itemType: "level" as const,
                    items: eventLevels,
                }] : []),
                {
                    title: { en: Text.Newest, ja: Text.Newest },
                    icon: Icon.Level,
                    itemType: "level" as const,
                    items: publicLevels,
                },
                {
                    title: { en: Text.Random, ja: Text.Random },
                    icon: Icon.Level,
                    itemType: "level" as const,
                    items: publicLevels.sort(() => Math.random() - 0.5),
                }
            ]
        };
    }
}