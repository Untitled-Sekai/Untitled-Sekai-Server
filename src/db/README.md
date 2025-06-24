## 使用例

```typescript
import { connectDB, importDataFromFile, exportDataToFile, importToDocker, exportFromDocker } from './db/index.js';

// デフォルト設定で接続
await connectDB();

// Docker設定に切り替え
await connectDB('docker');

// ローカルJSONファイルからデータをインポート
await importDataFromFile('./path/to/_data/backup.json');

// 現在のDBデータをファイルにエクスポート
const exportedFilePath = await exportDataToFile();

// エクスポートしたデータをDockerに戻す
await importToDocker(exportedFilePath);
```