# base node image
FROM node:20 as base
ENV NODE_ENV production
RUN apt-get update && apt-get install -y openssl sqlite3

# Install all node_modules, including dev dependencies
FROM base as deps
WORKDIR /app
ADD package.json .npmrc ./
RUN --mount=type=secret,id=NPM_GITHUB_TOKEN \
  NPM_GITHUB_TOKEN=$(cat /run/secrets/NPM_GITHUB_TOKEN) \
  npm install --production=false

# Setup production node_modules
FROM base as production-deps
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD package.json .npmrc ./
RUN npm prune --production

# Build the app
FROM base as build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD prisma .
RUN npx prisma generate
ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base
ENV DATABASE_URL=file:/data/sqlite.db
ENV PORT="8080"
ENV NODE_ENV="production"
ENV ENABLE_METRICS="true"
ENV METRICS_PORT="9091"
ENV BUTTON_COLOR="indigo"

# add shortcut for connecting to database CLI
RUN echo "#!/bin/sh\nset -x\nsqlite3 \$DATABASE_URL" > /usr/local/bin/database-cli && chmod +x /usr/local/bin/database-cli

WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/start.sh /app/start.sh
COPY --from=build /app/prisma /app/prisma

RUN npx prisma db push
RUN npx ts-node --require tsconfig-paths/register prisma/seed.ts

ENTRYPOINT [ "./start.sh" ]
