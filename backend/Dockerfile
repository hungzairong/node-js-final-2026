FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# npm install 也可以，容器一樣裝得起來、後端也能啟動。

# npm ci --omit=dev 是容器建置比較適合的寫法，做了兩件事：
# npm ci 完全照 package-lock.json 安裝，版本和本機鎖住的一樣。
# package.json 和 lock 檔對不上時會直接失敗，不會悄悄裝到別的版本。
# --omit=dev 不安裝開發用套件。你的 devDependencies 裡只有 nodemon，
# 容器是用 npm start 跑 node ./bin/www.js，不需要它。少裝這包，映像檔會小一點
RUN npm ci --omit=dev

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
