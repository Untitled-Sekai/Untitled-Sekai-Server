import { ServerFormsModel } from "@sonolus/express";
import { Text, Icon } from "@sonolus/core";
import { toMultiValues } from "../utils/form.js";
import { playlist_type } from "../utils/playlist.js";

export const searches_playlist = {
    advanced: {
        title: { en: Text.Advanced },
        icon: Icon.Advanced,
        requireConfirmation: false,
        options: {
            keywords: {
                name: { en: Text.Keywords },
                required: false,
                type: 'text',
                placeholder: { en: Text.KeywordsPlaceholder },
                def: '',
                limit: 0,
                shortcuts: [],
            },
            random: {
                name: { en: Text.Random },
                required: false,
                type: 'toggle',
                def: false,
            },
            title: {
                name: { en: Text.Title },
                required: false,
                type: 'text',
                def: '',
                placeholder: { en: Text.TitlePlaceholder },
                shortcuts: [],
                limit: 0,
            },
            type: {
                name: { en: Text.Type },
                required: false,
                type: 'multi',
                values: toMultiValues(playlist_type),
            },
            minRating: {
                name: { en: Text.RatingMinimum },
                required: false,
                type: 'slider',
                def: 1,
                min: 1,
                max: 99,
                step: 1,
            },
            maxRating: {
                name: { en: Text.RatingMaximum },
                required: false,
                type: 'slider',
                def: 99,
                min: 1,
                max: 99,
                step: 1,
            },
        }
    }
} satisfies ServerFormsModel