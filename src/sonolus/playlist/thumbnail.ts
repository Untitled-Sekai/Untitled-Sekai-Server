import { TileGrid, resize } from 'tilegrid_gen';
import { promises as fs } from 'fs';
import { Input } from './type.js';

export async function generateThumbnail(imageBuffer: Buffer, size: number): Promise<Buffer> {
    const images: Input = {
        data: imageBuffer
    };

    const options = {
        output: size,
        background: 'transparent',
    }

    const result = await TileGrid([images], options)
    if (result.count === 0) {
        throw new Error('No images to process');
    }
    if (result.gridSize === 0) {
        throw new Error('Invalid grid size');
    }
    if (result.buffer.length === 0) {
        throw new Error('Generated buffer is empty');
    }

    return result.buffer;
}