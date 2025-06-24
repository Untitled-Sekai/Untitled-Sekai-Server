sudo docker stop reuntitled_sekai-mongodb-1

echo "既存のMongoDBデータを.wtファイルで上書きします..."
sudo docker run --rm -v mongodb_data:/data/db -v $(pwd)/_data:/source_data alpine sh -c "rm -rf /data/db/* && cp -av /source_data/. /data/db/ && chown -R 999:999 /data/db"

echo "MongoDBコンテナを再起動します..."
sudo docker start reuntitled_sekai-mongodb-1