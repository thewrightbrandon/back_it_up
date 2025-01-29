# Use an official Node.js image from Docker Hub
FROM node:18

# Set the directory inside the container where your app will live
WORKDIR /app

# Copy only package.json and package-lock.json first (this helps with caching dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your project files into the container
COPY . .

# Set the environment variables
ENV NODE_ENV=development

# Set the default command to run your app
CMD ["node", "src/app.js"]