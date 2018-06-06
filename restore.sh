sudo docker exec -it watcher_mongo_1 mongorestore --username monitor --password "m0n1t0r" --archive=/data/db/backup/monitor.gz --gzip
