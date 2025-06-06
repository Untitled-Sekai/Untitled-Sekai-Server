// install
import { sonolus } from "./index.js";
import { api } from "./api/index.js";
import { installSonolus } from "./sonolus/install.js";
import { auth } from "./auth/index.js";
import { connectDB } from "./db/index.js";
import { LevelModel } from "./models/level.js";
import { Background } from "./models/background.js";
import { startBot } from "./discord/launch.js";
import { levelActions } from "./sonolus/level/type.js";

import { LevelItemModel,BackgroundItemModel } from "@sonolus/express";

export const install = async () => {
    console.log("Installing Sonolus...");
    startBot();
    await connectDB();

    installSonolus();
    api();
    auth();
    
    const loadLevel = await LevelModel.find().sort({ createdAt: -1 }).lean();
    sonolus.level.items = loadLevel.map(doc => {
        const { _id, __v, createdAt, ...levelData } = doc;
        return levelData as unknown as LevelItemModel;
    });
    sonolus.level.actions = levelActions;

    const loadBackground = await Background.find().sort({ createdAt: -1 }).lean();
    const backgroundItems = loadBackground.map(doc => {
        const { _id, __v, createdAt, ...backgroundData } = doc;
        return backgroundData as unknown as BackgroundItemModel;
    });
    sonolus.background.items.unshift(...backgroundItems);
}