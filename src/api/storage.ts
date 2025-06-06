// storage
import { sonolus } from "../index.js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MESSAGE } from "../message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storagePath = path.join(__dirname, "../../repository");

export const getStorageData = async () => {

    function getFileType(filePath: string):string {
        const fileName = path.basename(filePath);
        const parentDir = path.basename(path.dirname(filePath));

        switch (parentDir) {
            case 'bgm':
                return 'audio';
            case 'cover':
                return 'image';
            case 'level':
                return 'chart';
            case 'preview':
                return 'preview';
            default:
                return 'other';
        }
    }

    async function getDirSize(dirPath: string, fileTypes: Record<string, { count: number, size: number }> = {}, largestFiles: any[] = []) {
        let totalSize = 0;
        let fileCount = 0;

        try {
            const files = await fs.readdir(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = await fs.stat(filePath);

                if (stat.isDirectory()) {
                    // 再帰的にサブディレクトリを処理
                    const subResult = await getDirSize(filePath, fileTypes, largestFiles);
                    totalSize += subResult.size;
                    fileCount += subResult.fileCount;
                } else {
                    // ファイルサイズを加算
                    totalSize += stat.size;
                    fileCount++;

                    // ファイルタイプの集計を更新
                    const fileType = getFileType(filePath);
                    if (!fileTypes[fileType]) {
                        fileTypes[fileType] = { count: 0, size: 0 };
                    }
                    fileTypes[fileType].count++;
                    fileTypes[fileType].size += stat.size;

                    // 大きいファイルランキングの更新
                    largestFiles.push({
                        name: file,
                        size: stat.size,
                        type: fileType,
                        path: filePath.replace(storagePath, ''),
                        uploadDate: stat.mtime.toISOString()
                    });

                    // サイズ順にソート
                    largestFiles.sort((a, b) => b.size - a.size);

                    // トップ5だけ保持
                    if (largestFiles.length > 5) {
                        largestFiles.pop();
                    }
                }
            }
        } catch (e) {
            console.error(MESSAGE.ERROR.SERVERERROR, e);
        }

        return {
            size: totalSize,
            fileCount,
            fileTypes,
            largestFiles
        };
    }

    sonolus.router.get('/api/storage', async (req, res) => {
        try {
            const totalSpace = 1024 * 1024 * 1024; // 1GB

            const { size: usedSpace, fileCount, fileTypes, largestFiles } = await getDirSize(storagePath);
            const storageData = {
                totalSpace,
                usedSpace,
                fileCount,
                fileTypes,
                largestFiles
            };

            res.json(storageData);
        } catch (e) {
            res.status(500).json(MESSAGE.ERROR.SERVERERROR);
        }
    });
}