import { LevelModel } from "../../models/level.js";
import { LevelItemModel } from "@sonolus/express";

export async function fetchLevels(): Promise<LevelItemModel[]> {
    try {
        const levels = await LevelModel.find().sort({ createdAt: -1 }).lean();

        return levels.map(doc => {
            const { _id, __v, createdAt, ...levelData } = doc;
            return levelData as unknown as LevelItemModel;
        });
    } catch (e) {
        console.error('Failed to fetch levels:', e);
        throw new Error('Database error while fetching levels');
    }
}

export async function fetchLevels_public(): Promise<LevelItemModel[]> {
    try {
        const levels = await LevelModel.find({ "meta.isPublic": true }).sort({ createdAt: -1 }).lean();

        return levels.map(doc => {
            const { _id, __v, createdAt, ...levelData } = doc;
            return levelData as unknown as LevelItemModel;
        });
    } catch (e) {
        console.error('Failed to fetch private levels:', e);
        throw new Error('Database error while fetching private levels');
    }
}