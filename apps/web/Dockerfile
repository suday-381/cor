FROM node:20-alpine AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json turbo.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm ci
RUN npx turbo run build --filter=web

FROM nginx:alpine
COPY --from=build /usr/src/app/apps/web/dist /usr/share/nginx/html
# Copy custom configuration template for environment variable substitution
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
