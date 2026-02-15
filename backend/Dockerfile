# Backend Dockerfile
FROM node:20

WORKDIR /app/backend

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Rebuild better-sqlite3 for the current architecture
RUN yarn add better-sqlite3 --force && yarn build

# Expose backend port
EXPOSE 5200

# Start the server
CMD ["node", "dist/index.js"]
