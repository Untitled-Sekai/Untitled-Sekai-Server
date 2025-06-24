set -e 

JSON_DIR="$(pwd)/_data_json"
MONGO_HOST="mongodb"
MONGO_PORT="27017"
DB_NAME="untitled_sekai"
MONGO_URI="mongodb://${MONGO_HOST}:${MONGO_PORT}/${DB_NAME}"

if [ ! -d "$JSON_DIR" ]; then
  echo "エラー: JSONディレクトリ($JSON_DIR)が存在しません"
  exit 1
fi

JSON_FILES=$(find "$JSON_DIR" -name "*.json" 2>/dev/null)
if [ -z "$JSON_FILES" ]; then
  echo "エラー: JSONファイルが見つかりません。wt2json.shでデータを変換してください。"
  exit 1
fi

echo "===== MongoDB JSONデータインポートツール ====="
echo "- JSONソース: $JSON_DIR"
echo "- 接続先DB: $MONGO_URI"


echo "- MongoDB接続を確認中..."
if ! docker exec -it reuntitled_sekai-mongodb-1 mongosh --quiet --eval "db.serverStatus().ok" &>/dev/null; then
  echo "警告: MongoDBに接続できません。サービスを再起動してください。"
  exit 1
fi


echo "- 既存データのバックアップを作成中..."
BACKUP_DIR="./mongodb_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
docker exec reuntitled_sekai-mongodb-1 mongodump --out=/tmp/backup --db="$DB_NAME" &>/dev/null || echo "  警告: バックアップ作成に失敗しました（既存データがない可能性があります）"
docker cp reuntitled_sekai-mongodb-1:/tmp/backup "$BACKUP_DIR" &>/dev/null || true
echo "  バックアップ先: $BACKUP_DIR"


echo "- JSONデータをMongoDBにインポートしています..."
IMPORT_COUNT=0
SUCCESS_COUNT=0

for JSON_FILE in $JSON_FILES; do
  FILE_NAME=$(basename "$JSON_FILE")
  COLLECTION_NAME="${FILE_NAME%.*}" 
  
  IMPORT_COUNT=$((IMPORT_COUNT + 1))
  echo "  コレクション[$COLLECTION_NAME]をインポート中... ($JSON_FILE)"
  
  
  docker cp "$JSON_FILE" reuntitled_sekai-mongodb-1:/tmp/$FILE_NAME
  
  
  if docker exec reuntitled_sekai-mongodb-1 mongoimport --db="$DB_NAME" --collection="$COLLECTION_NAME" --file=/tmp/$FILE_NAME --jsonArray --drop; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo "  ✅ 成功: $COLLECTION_NAME"
  else
    echo "  ❌ 失敗: $COLLECTION_NAME - インポート中にエラーが発生しました"
  fi
  
  
  docker exec reuntitled_sekai-mongodb-1 rm -f /tmp/$FILE_NAME
done

echo "===== インポート完了 ====="
echo "処理件数: $IMPORT_COUNT コレクション ($SUCCESS_COUNT 成功)"


echo "- データを検証中..."
docker exec reuntitled_sekai-mongodb-1 mongosh --quiet --eval "
  db = db.getSiblingDB('$DB_NAME');
  print('コレクション一覧:');
  const collections = db.getCollectionNames();
  collections.forEach(c => print(' - ' + c));
  
  print('\n各コレクションのドキュメント数:');
  collections.forEach(c => print(' - ' + c + ': ' + db[c].countDocuments() + '件'));
"

echo "インポート処理が完了しました。"