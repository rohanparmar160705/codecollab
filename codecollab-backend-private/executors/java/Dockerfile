
FROM node:18-alpine

# Install Java
RUN apk add --no-cache openjdk17-jdk

WORKDIR /app

COPY package.json .
RUN npm install

COPY runner.js .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "runner.js"]
