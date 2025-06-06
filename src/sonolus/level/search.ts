import { Text,Icon } from "@sonolus/core";
import { toMultiValues } from "../utils/form.js";
import { difficulties } from "../utils/difficulty.js";
import { ServerFormsModel} from '@sonolus/express'

export const searches = {
    advanced: {
        title: {en: Text.Advanced},
        icon: Icon.Advanced,
        requireConfirmation: false,
        options: {
            private: {
                name: { en: Text.Private },
                required: false,
                type: 'toggle',
                def: false,
                description: { en: 'You can need to login to see private levels.',ja: '非公開譜面を表示するにはログインが必要です。' },
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
            artists: {
                name: { en: Text.Artists },
                required: false,
                type: 'text',
                def: '',
                placeholder: { en: Text.ArtistsPlaceholder },
                shortcuts: [],
                limit: 0,
            },
            difficulties: {
                name: { en: Text.Difficulty },
                required: false,
                type: 'multi',
                values: toMultiValues(difficulties)
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