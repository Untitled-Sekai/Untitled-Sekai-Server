import { LevelItemType, levelitemType } from "./type.js";
import { ConvertResponse } from "./type.js";

import path from "path";
import fs from "fs";
import crypto from "crypto";

const repository = './repository'

export const generateId = (): string => {
    return crypto.randomUUID();
};

export async function saveCoverAsBackground(coverId: string): Promise<string> {
    try {
        const response = await fetch(`${process.env.SUB_IMAGE_URL || 'http://localhost:4003'}/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: "background_v3",
                url: `http://${process.env.HOST || 'localhost'}:${process.env.PORT || '4000'}/repository/cover/${coverId}`
            })
        });

        if (!response.ok) {
            console.error('変換サーバーの応答:', await response.text());
            throw new Error('fail to convert image!');
        }

        const { id } = await response.json() as ConvertResponse;

        const bgResponse = await fetch(`${process.env.SUB_IMAGE_URL || 'http://localhost:4003'}/download/${id}`);
        if (!bgResponse.ok) {
            throw new Error('fail to download image!');
        }

        const bgBuffer = Buffer.from(await bgResponse.arrayBuffer());
        return await saveData(bgBuffer, 'background');
    } catch (error) {
        console.error('error:', error);
        throw error;
    }
}

export const saveData = async (data: Buffer, type: LevelItemType, extension?: string): Promise<string> => {
    let typeFolder = '';
    
    switch(type) {
        case levelitemType.LEVEL:
            typeFolder = 'level';
            break;
        case levelitemType.COVER:
            typeFolder = 'cover';
            break;
        case levelitemType.BGM:
            typeFolder = 'bgm';
            break;
        case levelitemType.PREVIEW:
            typeFolder = 'preview';
            break;
        case levelitemType.BACKGROUND:
            typeFolder = 'background';
            break;
        case levelitemType.CHART:
            typeFolder = 'chart';
            break;
        default:
            typeFolder = 'other';
    }
    
    // フォルダのフルパス
    const typePath = path.join(repository, typeFolder);
    
    // フォルダがなければ作成（親フォルダも含めて再帰的に）
    if (!fs.existsSync(typePath)) {
        fs.mkdirSync(typePath, { recursive: true });
    }
    
    const id = generateId();
    // 拡張子があれば付ける
    const filePath = path.join(typePath, extension ? `${id}${extension}` : id);
    
    await fs.promises.writeFile(filePath, data);
    
    // 保存したファイルのIDを返す（拡張子付き）
    return extension ? `${id}${extension}` : id;
};