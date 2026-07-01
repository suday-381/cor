FROM node:20-alpine AS base
WORKDIR /usr/src/app

COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm ci
RUN npx turbo run build --filter=api

EXPOSE 3000
CMD ["node", "apps/api/dist/main"]
