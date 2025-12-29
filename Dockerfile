# Node.js Version 18 ကို သုံးပါမည်
FROM node:18

# App သိမ်းဆည်းမည့် နေရာ
WORKDIR /app

# Package များ Install လုပ်ခြင်း
COPY package*.json ./
RUN npm install

# Code အားလုံးကို ကူးယူခြင်း
COPY . .

# B4A အတွက် Port 8080 ကို သုံးပါမည်
EXPOSE 8080

# Bot ကို စတင် Run ပါမည်
CMD ["node", "index.js"]