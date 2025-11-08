# 项目简介
这是一个部署在公网HTTPS上的React文本编辑器应用的本地服务器，基于Node.js实现，使用Express框架搭建，支持基本的文本编辑功能，包括文本的增删改查等操作。

# 客户端公网链接
https://text-editor-client.vercel.app/

# 本地环境启动指南
1. 安装Node.js
2. 在项目根目录下打开终端，执行以下命令安装依赖：
```
npm install
```
3. 安装mkcert
    - Windows: `choco install mkcert`
    - macOS: `brew install mkcert`
    - Linux: `sudo apt-get install mkcert`
4. 生成本地CA根证书
```
mkcert -install
```
5. 在项目根目录下创建certs文件夹，并生成证书
```
mkdir -p certs
cd certs
mkcert localhost
```
6. 信任证书
    - Windows: mkcert 会自动将 CA 根证书添加到系统信任存储
    - macOS: 打开钥匙串访问，找到 mkcert 生成的 CA 证书，设置为 "始终信任"
    - Linux: 根据发行版不同，可能需要将 CA 证书添加到 /etc/ca-certificates/update.d/ 或使用图形工具
7. 启动本地服务器：
```
npm run start
```
8. 访问 https://text-editor-client.vercel.app/ 即可使用文本编辑器。

# 为什么选择HTTPS
1. 避免 Mixed Content 错误：由于前端应用部署在 HTTPS 上，如果本地服务使用 HTTP，浏览器会阻止从 HTTPS 页面发起的 HTTP 请求。
2. 安全性：HTTPS 确保前端与本地服务之间的通信是加密的，防止数据在传输过程中被窃听或篡改。
3. 现代浏览器安全策略：许多现代浏览器 API 要求页面运行在 HTTPS 环境下，使用 HTTPS 可以避免潜在的兼容性问题。

# 核心问题解决方案
1. Mixed Content 问题：
    - 本地服务也使用 HTTPS，确保前后端通信协议一致
    - 所有 API 调用都使用 HTTPS，避免从 HTTPS 页面请求 HTTP 资源
2. CORS 跨域问题：
    - 在本地服务器中配置了精确的 CORS 策略，只允许来自已部署前端域名的请求
    - 正确处理 OPTIONS 预检请求，确保复杂请求（如 POST、PUT、DELETE）能够正常工作
    - 配置了适当的允许头信息和方法
3. SSL 证书信任问题：
    - 使用 mkcert 生成可信的自签名证书，而不是浏览器默认不信任的自签名证书
    - mkcert 生成的证书由本地 CA 签名，通过安装并信任这个 CA，所有由它签名的证书都会被浏览器信任
    - 提供了详细的证书生成和信任步骤，确保用户能够正确配置本地环境
