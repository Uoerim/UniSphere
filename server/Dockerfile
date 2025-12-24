FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy source code
COPY . .

EXPOSE 4000

# Generate Prisma Client, run migrations, create admin (idempotent), and start server
CMD npx prisma generate && npx prisma db push --accept-data-loss && npm run create-admin && npm run dev
