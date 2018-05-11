# create a file named Dockerfile
FROM node:7-alpine

RUN apk add --no-cache git nano curl && npm install pm2  -g

WORKDIR /services/gatekeeper

EXPOSE 80

CMD ["pm2-docker", "process.json"]
