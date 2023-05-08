# app
Contains a frontend web application that brings together all pieces.
The application is built using [Remix](https://remix.run/).

## Usage
1. Export your personal access token with `read:packages` scope as `NPM_GITHUB_TOKEN` environment variable.
   ```sh
   export NPM_GITHUB_TOKEN=ghp_... 
   ```
2. Copy `development.env` to `.env` and fill in the appropriate environment variables.
3. Install dependencies:
   ```sh
   npm install
   ```
4. Run the application:
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
