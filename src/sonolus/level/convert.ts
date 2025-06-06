// 譜面の変換&圧縮
import { anyToUSC } from "usctool";
import { uscToLevelData } from "../../../lib/sonolus-pjsekai-engine-extended/convert.js";
import { gzip } from "zlib";
import { promisify } from "util";

const gzipPromise = promisify(gzip);

export async function convertChart(buffer: Buffer, fileType: string): Promise<Buffer> {
    const content = buffer.toString('utf-8');
    const usc = anyToUSC(new TextEncoder().encode(content));
    const leveldata = JSON.stringify(uscToLevelData(usc.usc));

    return await gzipPromise(Buffer.from(leveldata));
}