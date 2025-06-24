import { LevelItemType, levelitemType } from "./type.js";
import { ConvertResponse } from "./type.js";

import path from "path";
import fs from "fs";
import crypto from "crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";

dotenv.config();

const repository = './repository';

// Cloudflare R2クライアントの設定
const storageType = process.env.STORAGE_TYPE || 'local';
export const s3Client = storageType === 'r2' ? new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY || ''
    }
}) : null;
export const bucketName = process.env.CLOUDFLARE_R2_BUCKET || 'storage';

export const generateId = (): string => {
    return crypto.randomUUID();
};

export async function saveCoverAsBackground(coverId: string): Promise<string> {
    try {
        const imageUrl = `https://storage.pim4n-net.com/us/repository/cover/${coverId}`;
        
        console.log('imageUrl:', imageUrl);
        const response = await fetch(`${process.env.SUB_IMAGE_URL || 'http://localhost:4003'}/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: "background_v3",
                url: imageUrl
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
    
    const id = generateId();
    const fileName = extension ? `${id}${extension}` : id;
    
    if (storageType === 'r2' && s3Client) {
        try {
            const objectKey = `us/repository/${typeFolder}/${fileName}`;
            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: bucketName,
                    Key: objectKey,
                    Body: data,
                    ContentType: getContentType(extension),
                }
            });
            
            await upload.done();
            console.log(`ファイルをR2に保存しました: ${objectKey}`);
            return fileName;
        } catch (error) {
            console.error('R2ストレージへの保存に失敗しました:', error);
            throw error;
        }
    } else {
        const typePath = path.join(repository, typeFolder);
        
        if (!fs.existsSync(typePath)) {
            fs.mkdirSync(typePath, { recursive: true });
        }
        
        const filePath = path.join(typePath, fileName);
        await fs.promises.writeFile(filePath, data);
        
        return fileName;
    }
};

const getContentType = (extension?: string): string => {
    if (!extension) return 'application/octet-stream';
    
    const ext = extension.toLowerCase().replace('.', '');
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'mp3':
            return 'audio/mpeg';
        case 'wav':
            return 'audio/wav';
        case 'json':
            return 'application/json';
        default:
            return 'application/octet-stream';
    }
};