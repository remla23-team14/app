#!/bin/sh

# Function to handle SIGINT and exit gracefully
exit_gracefully() {
  echo "Received SIGINT, exiting gracefully..."
  pkill -f "npm run start"
  exit 0
}

# Trap the SIGINT signal and call the exit_gracefully function
trap "exit_gracefully" INT

set -ex
npx prisma db push
npx ts-node --require tsconfig-paths/register prisma/seed.ts
npm run start & wait
