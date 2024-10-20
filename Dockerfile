FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install app dependencies
COPY package.json ./
RUN npm i -g pnpm
RUN pnpm i

# Copy app source code
COPY . .

# Expose port and start application
EXPOSE 8060
CMD ["pnpm", "start"]
