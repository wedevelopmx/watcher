sudo docker exec -it watcher_mongo_1 mongodump --username monitor --password "m0n1t0r" --archive=/data/db/monitor.gz --gzip
ls data/db/mongo/*.gz
