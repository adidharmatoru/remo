# Install dependencies
FROM node:21-slim AS dependencies

WORKDIR /home/app
COPY package.json ./
# COPY package-lock.json ./
RUN npm install

########################################################

# Build the application
FROM node:21-slim AS builder

WORKDIR /home/app
COPY --from=dependencies /home/app/node_modules ./node_modules
COPY . .
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"
RUN npm run build

########################################################

# Run the application
FROM node:21-slim AS runner

WORKDIR /home/app
COPY --from=builder /home/app/.output /home/app/.output
COPY --from=builder /home/app/package.json /home/app/package.json
COPY --from=builder /home/app/node_modules /home/app/node_modules

ENV NODE_ENV=production
ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["node", ".output/server/index.mjs"]