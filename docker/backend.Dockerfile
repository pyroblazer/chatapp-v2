# --- Development stage ---
FROM node:18.20-alpine AS development
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
EXPOSE 3001
CMD ["yarn", "start:dev"]

# --- Build stage ---
FROM node:18.20-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# --- Production stage ---
FROM node:18.20-alpine AS production
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
