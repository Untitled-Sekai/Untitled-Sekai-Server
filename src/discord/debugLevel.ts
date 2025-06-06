import { LevelModel } from '../models/level.js';

export const checkLevelExists = async (levelName: string) => {
  try {
    const level = await LevelModel.findOne({ name: levelName });
    if (level) {
      console.log(`✅ 譜面「${levelName}」が見つかりました`);
      return true;
    } else {
      console.log(`❌ 譜面「${levelName}」は見つかりませんでした`);
      return false;
    }
  } catch (error) {
    console.error('譜面チェック中にエラー発生:', error);
    return false;
  }
};

export const listAllLevels = async () => {
  try {
    const levels = await LevelModel.find().select('name title').limit(20);
    
    console.log('【登録譜面一覧（最大20件）】');
    levels.forEach((level, index) => {
      const title = level.title?.ja || level.title?.en || 'タイトルなし';
      console.log(`${index + 1}. ${level.name} - ${title}`);
    });
    
    return levels.map(l => ({ name: l.name, title: l.title }));
  } catch (error) {
    console.error('譜面リスト取得中にエラー発生:', error);
    return [];
  }
};