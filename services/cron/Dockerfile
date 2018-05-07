# create a file named Dockerfile
FROM node:7-alpine

WORKDIR /services/cron

RUN  npm install pm2 -g && mkdir -p log

EXPOSE 80

CMD ["pm2-docker", "process.json"]
