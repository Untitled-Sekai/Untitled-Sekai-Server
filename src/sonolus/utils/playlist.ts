import { Text } from "@sonolus/core";
import { mapValues } from "./index.js";

export const playlist_type = mapValues(
    {
        PASS: { en: 'Pass' },
        FC: { en: 'Full Combo' },
        AP: { en: 'All Perfect' },
        CUSTOM: { en: 'Custom' },
    },
    (_, title, index) => ({ title, index }),
)

export type PlaylistType = keyof typeof playlist_type;