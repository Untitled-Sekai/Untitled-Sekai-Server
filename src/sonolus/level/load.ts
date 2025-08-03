import { LevelModel } from "../../models/level.js";
import { LevelItemModel } from "@sonolus/express";
import { cacheManager, CACHE_TTL } from "../../utils/cache.js";

export async function fetchAndFormatLevels() {
  // キャッシュから取得を試みる
  const cacheKey = cacheManager.generateKey('levels', 'formatted');
  const cached = await cacheManager.get<{
    publicLevels: LevelItemModel[];
    privateLevels: LevelItemModel[];
  }>(cacheKey);

  if (cached) {
    console.log('レベルリストをキャッシュから取得');
    return cached;
  }

  // キャッシュにない場合はDBから取得
  const publicLevels = await LevelModel.find({
    'meta.isPublic': true,
    'meta.isHidden': { $ne: true },
    'meta.banned.isBanned': { $ne: true }
  }).sort({ uploadDate: -1 }).lean();

  const privateLevels = await LevelModel.find({
    'meta.isPublic': false,
    'meta.isHidden': { $ne: true },
    'meta.banned.isBanned': { $ne: true }
  }).sort({ uploadDate: -1 }).lean();

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
  
  const result = {
    publicLevels: formattedPublicLevels,
    privateLevels: formattedPrivateLevels
  };

  // 結果をキャッシュに保存
  await cacheManager.set(cacheKey, result, CACHE_TTL.LEVEL_LIST);

  return result;
}

export async function getFormattedLevels() {
  const { publicLevels } = await fetchAndFormatLevels();
  return publicLevels;
}