# Use the lighttpd image as the base image
FROM node:21 AS dependencies

WORKDIR /home/app
COPY package.json ./
# COPY package-lock.json ./
RUN npm install

FROM node:21 AS builder

WORKDIR /home/app
COPY --from=dependencies /home/app/node_modules ./node_modules
COPY . .
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"
RUN npm run generate

FROM rtsp/lighttpd AS runner

# Copy Nuxt static build into the document root of the web server
COPY --from=builder /home/app/.output/public /var/www/html
COPY lighttpd.conf /etc/lighttpd/lighttpd.conf