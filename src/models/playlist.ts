import mongoose from "mongoose";
import { LevelModel } from "./level.js";
import { LevelData } from "../sonolus/level/type.js";

const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    version: { type: Number, default: 1 },
    title: {
        en: { type: String, required: true },
        ja: { type: String, required: true }
    },
    subtitle: {
        en: { type: String, required: true },
        ja: { type: String, required: true }
    },
    author: {
        en: { type: String, required: true },
        ja: { type: String, required: true }
    },
    tags: [{
        title: {
            en: String,
            ja: String
        },
        icon: String
    }],
    levels: [{ type: mongoose.Schema.Types.Mixed }],
    thumbnail: {
        hash: String,
        url: String
    }
})

export interface IPlaylist extends mongoose.Document {
    name: string;
    version: number;
    title: {
        en: string;
        ja: string;
    };
    subtitle: {
        en: string;
        ja: string;
    };
    author: {
        en: string;
        ja: string;
    };
    tags: Array<{
        title: {
            en: string;
            ja: string;
        };
        icon?: string;
    }>;
    levels: LevelData[];
    thumbnail: {
        hash: string;
        url: string;
    };
}

export const PlaylistModel = mongoose.model<IPlaylist>('Playlist', playlistSchema);