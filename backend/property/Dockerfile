FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY src ./src

ENV PORT=8002

EXPOSE 8002

CMD ["npm", "start"]
