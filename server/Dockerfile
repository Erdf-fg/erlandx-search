FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Hugging Face Spaces port default adalah 7860
ENV PORT=7860
EXPOSE 7860

CMD ["node", "index.js"]
