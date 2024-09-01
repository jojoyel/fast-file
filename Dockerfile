# Step 1: Use the official Node.js image as the base image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy the package.json and package-lock.json to the working directory
COPY package*.json ./

# Step 4: Install the application dependencies
RUN npm install

RUN mkdir -p /usr/src/app/files
RUN mkdir -p /usr/src/app/tmp
RUN mkdir -p /usr/src/app/keys

# Step 5: Copy the application code to the working directory
COPY . .

# Step 6: Expose the port that the application will run on
EXPOSE 3002

# Step 7: Define the command to start the application
CMD ["node", "index.js"]