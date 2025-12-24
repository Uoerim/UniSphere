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

# Generate Prisma Client and start server
CMD npx prisma generate && npm run dev
