import { LevelModel } from "../../models/level.js";
import { LevelItemModel } from "@sonolus/express";

export async function fetchAndFormatLevels() {
  const publicLevels = await LevelModel.find({ "meta.isPublic": true }).sort({ createdAt: -1 }).lean();
  const privateLevels = await LevelModel.find({ "meta.isPublic": false }).sort({ createdAt: -1 }).lean();
  
  const formattedPublicLevels = publicLevels.map(doc => {
    const { _id, __v, createdAt, ...levelData } = doc;
    return {
      ...levelData,
      meta: {
        ...levelData.meta,
        isPublic: levelData.meta?.isPublic ?? true,
      }
    } as unknown as LevelItemModel;
  });
  
  const formattedPrivateLevels = privateLevels.map(doc => {
    const { _id, __v, createdAt, ...levelData } = doc;
    return {
      ...levelData,
      meta: {
        ...levelData.meta,
        isPublic: levelData.meta?.isPublic ?? false,
      }
    } as unknown as LevelItemModel;
  });
  
  return {
    publicLevels: formattedPublicLevels,
    privateLevels: formattedPrivateLevels
  };
}

export async function getFormattedLevels() {
  const { publicLevels } = await fetchAndFormatLevels();
  return publicLevels;
}