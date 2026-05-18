FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/

# Install dependencies
RUN cd apps/backend && npm ci --only=production

# Copy backend source
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/nest-cli.json ./apps/backend/

# Build backend
RUN cd apps/backend && npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "apps/backend/dist/main.js"]
