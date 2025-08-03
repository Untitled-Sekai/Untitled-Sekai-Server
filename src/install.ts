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
import { fetchLevels } from "./db/fetch/level.js";
import { fetchBackgrounds } from "./db/fetch/background.js";

import { LevelItemModel,BackgroundItemModel } from "@sonolus/express";

export const install = async () => {
    console.log("Installing Sonolus...");
    startBot();
    const isDocker = process.env.MONGODB_URI?.includes('mongodb://mongodb');
    await connectDB();

    installSonolus();
    api();
    auth();
    
    const levels = await fetchLevels();
    sonolus.level.items.unshift(...levels);
    
    sonolus.level.actions = levelActions;

    const backgrounds = await fetchBackgrounds();
    sonolus.background.items.unshift(...backgrounds);
}