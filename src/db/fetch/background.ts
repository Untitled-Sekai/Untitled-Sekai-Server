import { Background } from "../../models/background.js";
import { BackgroundItemModel } from "@sonolus/express";

export async function fetchBackgrounds(): Promise<BackgroundItemModel[]> {
    try {
        const backgrounds = await Background.find().sort({ createdAt: -1 }).lean();

        return backgrounds.map(doc => {
            const { _id, __v, ...backgroundData } = doc;
            return backgroundData as unknown as BackgroundItemModel;
        });
    } catch (e) {
        console.error('Failed to fetch backgrounds:', e);
        throw new Error('Database error while fetching backgrounds');
    }
}