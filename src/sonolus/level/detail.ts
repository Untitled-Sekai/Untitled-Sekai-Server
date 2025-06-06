import { sonolus } from "../../index.js";
import { isValidSession, getProfile } from "../auth/state.js";
import { LevelModel } from "../../models/level.js";
import { UserModel } from "../../models/user.js";
import { LevelItemModel } from "@sonolus/express";

export const detail_level = () => {
    sonolus.level.detailsHandler = async ({ itemName, session }) => {
        const item = await LevelModel.findOne({ name: itemName }) as LevelItemModel;
        if (!item) return 404;

        let actions = [
            {
                type: 'like',
                title: { en: 'Like', ja: 'いいね' },
                icon: 'heartHollow',
                requireConfirmation: false,
                options: []
            }
        ];

        if (session && isValidSession(session)) {
            const profile = getProfile(session);
            if (profile) {
                const userhandle = profile.handle;
                const user = await UserModel.findOne({ "sonolusProfile.handle": userhandle });

                if (user) {
                    const likedCharts = Array.isArray(user.likedCharts) ? user.likedCharts : [];

                    if (likedCharts.includes(itemName)) {
                        actions = [
                            {
                                type: "unlike",
                                title: { en: "Unlike", ja: "いいね解除" },
                                icon: "heart",
                                requireConfirmation: false,
                                options: []
                            }
                        ];
                    }
                }
            }
        }

        return {
            item,
            description: item.description,
            actions: actions,
            hasCommunity: false,
            leaderboards: [],
            sections: []
        };
    }
}