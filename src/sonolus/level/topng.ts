// coverをpngに
import sharp from 'sharp';

export async function convertToPng(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
        .png()
        .toBuffer();
}