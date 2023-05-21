# app
Contains a frontend web application that brings together all pieces.
The application is built using [Remix](https://remix.run/).

## Usage
1. Make sure you have [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.
2. Export your personal access token with `read:packages` scope as `NPM_GITHUB_TOKEN` environment variable. For example:
   ```sh
   export NPM_GITHUB_TOKEN=ghp_... 
   ```
3. Copy `development.env` to `.env` and fill in the appropriate environment variables.
4. Install dependencies:
   ```sh
   npm install
   ```
5. Run the application:
   ```sh
   npm run dev
   ```

## Building the Docker Image
1. Export your personal access token with `read:packages` scope into a file called `NPM_GITHUB_TOKEN.txt`:
   ```sh
   printf "ghp_..." > NPM_GITHUB_TOKEN.txt
   ```
2. Build the image using the secret file:
   ```sh
   docker build --secret id=NPM_GITHUB_TOKEN,src=./NPM_GITHUB_TOKEN.txt .
   ```
