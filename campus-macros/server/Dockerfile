FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/* \
 && npm ci --omit=dev
COPY . .
ENV NODE_ENV=production PORT=4000 DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 4000
CMD ["node", "src/index.js"]
