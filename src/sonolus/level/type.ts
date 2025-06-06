import { DatabaseBackgroundItem } from "@sonolus/core";

export const levelitemType = {
    LEVEL: 'level',
    CHART: 'chart',
    COVER: 'cover',
    BGM: 'bgm',
    PREVIEW: 'preview',
    BACKGROUND: 'background',
}

export interface ConvertResponse {
    id: string;
}

export interface LevelData {
    name: string;
    version: 1;
    rating: number;
    title: {
        en: string;
        ja: string;
    };
    artists: {
        en: string;
        ja: string;
    };
    author: {
        en: string;
        ja: string;
    };
    tags: Array<{
        title: { en: string; ja: string };
        icon?: string;
    }>;
    description: {
        en: string;
        ja: string;
    };
    engine: string;
    useSkin: {
        useDefault: true;
    };
    useBackground: {
        useDefault: false;
        item: string | DatabaseBackgroundItem;
    };
    useEffect: {
        useDefault: true;
    };
    useParticle: {
        useDefault: true;
    };
    cover: {
        hash: string;
        url: string;
    };
    bgm: {
        hash: string;
        url: string;
    };
    data: {
        hash: string;
        url: string;
    };
    preview: {
        hash: string;
        url: string;
    }
    meta: {
        isPublic: boolean;
        wasPublicBefore: boolean;
        derivative: {
            isDerivative: boolean;
            id?: {  // idはオプショナルにする
                name: string;
            };
        };
        fileOpen: boolean;  // オブジェクトじゃなくてbooleanだからね
        originalUrl?: string;  // あるときだけ入るから？マークつける
        collaboration: {
            iscollaboration: boolean;
            members?: Array<{  // これもオプショナルで配列型
                handle: number;
            }>;
        },
        privateShare: {
            isPrivateShare: boolean;
            users?: Array<{
                handle: number;
            }>
        },
        anonymous: {
            isAnonymous: boolean;
            anonymous_handle: String;
            original_handle: Number;
        }

    }
}

export const levelActions = [
    {
        type: 'like',
        title: { en: 'Like', ja: 'いいね' },
        icon: 'heartHollow',
        requireConfirmation: false,
        options: []
    }
]

export const unlikeLevelAction = [
    {
        type: "unlike",
        title: { en: "Unlike", ja: "いいね解除" },
        icon: "heart",
        requireConfirmation: false,
        options: []
    }
]


export type LevelItemType = typeof levelitemType[keyof typeof levelitemType]

declare module '@sonolus/express' {
    interface LevelItemModel {
        meta: {
            isPublic: boolean;
            wasPublicBefore: boolean;
            derivative: {
                isDerivative: boolean;
                id?: {
                    name: string;
                };
            };
            fileOpen: boolean;
            originalUrl?: string;
            collaboration: {
                iscollaboration: boolean;
                members?: Array<{
                    handle: number;
                }>;
            },
            privateShare: {
                isPrivateShare: boolean;
                users?: Array<{
                    handle: number;
                }>
            },
            anonymous: {
                isAnonymous: boolean;
                anonymous_handle: String;
                original_handle: Number;
            }
        }
    }
}