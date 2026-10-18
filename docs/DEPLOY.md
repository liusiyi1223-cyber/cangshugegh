# 部署文档

把「互联网总收藏夹」部署到阿里云轻量应用服务器的完整步骤。备案通过后照着做即可。

## 前置条件

- ICP 备案已通过（大陆服务器未备案不能对外提供网站服务）。
- 域名已做 A 记录解析，指向服务器的公网 IP。
- 服务器：阿里云轻量应用服务器，地域为大陆节点，镜像 **Ubuntu 22.04**，2 核 2GB。
- 服务器已开放端口：**22**（SSH）、**80**（HTTP）、**443**（HTTPS）。

## 一、登录服务器

用阿里云控制台的「远程连接」或本地终端 SSH：

```bash
ssh root@你的服务器公网IP
```

## 二、安装 Node.js 与 PostgreSQL

```bash
# 更新软件源
sudo apt-get update

# 安装 Node.js 20 LTS（Next.js 16 需要 Node 18.18+）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL
sudo apt-get install -y postgresql

# 安装 git 与 nginx
sudo apt-get install -y git nginx
```

验证：

```bash
node -v   # 应显示 v20.x
psql --version
```

## 三、创建数据库和用户

```bash
sudo -u postgres psql
```

进入 psql 后执行（把 `你的密码` 换成强密码）：

```sql
CREATE USER cangshuge WITH PASSWORD '你的密码';
CREATE DATABASE cangshuge OWNER cangshuge;
\q
```

## 四、拉取代码并安装依赖

```bash
# 用 HTTPS 拉取（服务器上没配 SSH 的话）
git clone https://github.com/liusiyi1223-cyber/cangshugegh.git
cd cangshugegh
npm install
```

## 五、配置环境变量

```bash
cp .env.example .env
nano .env
```

`.env` 里填两项（**不要把 .env 提交或分享出去**）：

```
DATABASE_URL="postgresql://cangshuge:你的密码@localhost:5432/cangshuge?schema=public"
JWT_SECRET="随机生成的密钥"
```

生成 JWT_SECRET（复制输出填进去）：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 六、初始化数据库并构建

```bash
# 应用数据库迁移（生产环境用 deploy，不会生成新迁移文件）
npx prisma migrate deploy

# 生成 Prisma 客户端
npx prisma generate

# 生产构建
npm run build
```

## 七、用 PM2 守护进程

```bash
sudo npm install -g pm2

# 启动（在项目目录下）
pm2 start npm --name cangshuge -- start

# 保存进程列表并设置开机自启
pm2 save
pm2 startup
```

验证本地能访问：

```bash
curl http://localhost:3000/login
```

应返回登录页的 HTML。

## 八、配置 Nginx 反向代理

创建站点配置：

```bash
sudo nano /etc/nginx/sites-available/cangshuge
```

内容：

```nginx
server {
    listen 80;
    server_name 你的域名;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/cangshuge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 九、配置 HTTPS（Let's Encrypt 免费证书）

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

按提示完成，certbot 会自动续期。

## 十、挂备案号

备案通过后，把 ICP 备案号放到网站底部（footer），并链接到工信部备案管理系统。这一步在代码里加一个 footer 组件，或部署后手动改。

## 十一、后续更新部署

每次改完代码推送到 GitHub 后，在服务器上执行：

```bash
cd ~/cangshugegh
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 restart cangshuge
```

## 十二、封面图存储说明

封面图在保存收藏时由后端下载到项目目录下的 `data/covers/`，再由 `/api/covers/...` 回显，不依赖源站 CDN。要点：

- 该目录首次保存时自动创建（`mkdir -p`），无需手动建。
- `data/` 已加入 `.gitignore`，`git pull` 更新不会删除或覆盖封面，跨部署持久。
- 若换服务器或误删目录，历史封面的本地文件会丢失（DB 里仍是 `/api/covers/...` 相对路径），届时需重新保存或后续做回填。
- 需保证 PM2 以项目目录为工作目录运行（上面 `pm2 start npm --name cangshuge -- start` 默认即项目目录），否则 `process.cwd()` 指向错误会导致封面写不进读不出。

## 常见问题

- **端口不通**：检查阿里云轻量应用服务器的「防火墙」是否放行了 80/443，以及安全组规则。
- **`npm run build` 内存不足**：2GB 内存构建 Next.js 可能紧张，可临时加 swap 或改用 `NODE_OPTIONS=--max-old-space-size=1024`。
- **数据库连不上**：确认 `.env` 里的 DATABASE_URL 用户名/密码/库名与第三步一致。
- **备案号还没下来**：备案通过前不要绑定域名对外提供访问，否则有被阻断的风险。
