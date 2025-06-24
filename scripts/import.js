const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('/tmp/data/backup.json', 'utf8'));
  
  Object.keys(data).forEach(collection => {
    if (Array.isArray(data[collection]) && data[collection].length > 0) {
      print(`コレクション ${collection} を処理中... (${data[collection].length}件)`);
      
      try {
        db[collection].drop();
      } catch (e) {
        print(`コレクション ${collection} の削除に失敗しました: ${e.message}`);
      }
      
      if (data[collection].length > 0) {
        db[collection].insertMany(data[collection]);
        print(`コレクション ${collection} のインポートが完了しました`);
      }
    }
  });
} catch (e) {
  print(`エラーが発生しました: ${e.message}`);
  printjson(e);
}