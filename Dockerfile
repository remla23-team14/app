# base node image
FROM node:20 as base
ENV NODE_ENV production
RUN apt-get update && apt-get install -y openssl sqlite3

# Install all node_modules, including dev dependencies
FROM base as deps
WORKDIR /app
ADD package.json ./
RUN npm install --omit=dev

# Setup production node_modules
FROM base as production-deps
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD package.json ./
RUN npm prune --omit=dev

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

ENTRYPOINT [ "./start.sh" ]
