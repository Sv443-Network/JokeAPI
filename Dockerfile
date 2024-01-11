FROM node:alpine

# Set working directory
WORKDIR /app

# Install app dependencies
COPY package.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose port and start application
EXPOSE 8060
CMD ["npm", "start"]
