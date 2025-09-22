# Use official Node.js image
FROM node:20

# Install Python and ImageMagick
RUN apt-get update && \
    apt-get install -y python3 python3-pip imagemagick && \
    pip3 install gtts moviepy

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 5000

CMD ["npm", "start"]
