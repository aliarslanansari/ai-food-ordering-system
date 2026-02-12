# ---- Build frontend ----
FROM node:20 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install
COPY frontend .
RUN yarn build

# ---- Build backend ----
FROM node:20
WORKDIR /app/backend
COPY backend/package.json backend/yarn.lock ./
RUN yarn install
COPY backend .
RUN yarn build

# Copy frontend build into backend
COPY --from=frontend-build /app/frontend/dist ./dist-frontend

EXPOSE 5200
CMD ["node", "dist/index.js"]
