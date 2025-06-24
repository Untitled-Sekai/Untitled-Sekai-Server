TEMP_DIR="/tmp/mongodb_temp"
mkdir -p $TEMP_DIR


docker run --rm -d --name temp_mongodb \
  -v $(pwd)/_data:/data/db \
  -p 27018:27017 \
  mongo:6

echo "一時的なMongoDBインスタンスが起動するまで待機中..."
sleep 10

docker exec temp_mongodb mongosh --eval '
  db = db.getSiblingDB("untitled_sekai");
  db.getCollectionNames().forEach(function(coll) {
    print("コレクション " + coll + " をエクスポート中...");
    var cmd = "mongoexport --db=untitled_sekai --collection=" + coll + 
              " --out=/tmp/" + coll + ".json --jsonArray";
    runCommand({ "exec": "bash", "args": ["-c", cmd] });
  })
'

mkdir -p _data_json
docker cp temp_mongodb:/tmp/ _data_json/

docker stop temp_mongodb

echo "変換完了: _data_json ディレクトリにJSONファイルが保存されました"