// プレビュー処理
import crypto from 'crypto';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface AudioPreviewResult {
    buffer: Buffer;
}

export async function createAudioPreview(buffer: Buffer): Promise<AudioPreviewResult> {
    const tempFileName = 'temp_' + crypto.randomBytes(8).toString('hex') + '.mp3';
    const tempPreviewName = 'temp_preview_' + crypto.randomBytes(8).toString('hex') + '.mp3';

    await fs.writeFile(tempFileName, buffer);

    try {
        await execAsync(`ffmpeg -i ${tempFileName} -t 15 -acodec libmp3lame -b:a 192k ${tempPreviewName}`);

        const previewBuffer = await fs.readFile(tempPreviewName);

        await fs.unlink(tempFileName);
        await fs.unlink(tempPreviewName);

        return {
            buffer: previewBuffer
        };
    } catch (error: unknown) {
        console.error('プレビュー作成エラー:', error);

        try {
            await fs.unlink(tempFileName);
            if (existsSync(tempPreviewName)) {
                await fs.unlink(tempPreviewName);
            }
        } catch (e: unknown) {
            console.error('一時ファイル削除エラー:', e);
        }

        throw error;
    }
}