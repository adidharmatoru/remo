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

# Define build-time arguments with defaults
ARG NODE_ENV=production
ARG PORT=80
ARG HOST=0.0.0.0

# Set default environment variables that can be overridden at runtime
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV HOST=${HOST}

# Add runtime config variables for Nuxt
ENV NUXT_LIVEKIT_API_KEY=""
ENV NUXT_LIVEKIT_API_SECRET=""
ENV NUXT_LIVEKIT_WS_URL=""

EXPOSE ${PORT}

CMD ["node", ".output/server/index.mjs"]