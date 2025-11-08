import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// 配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 9527;
const FILES_DIR = path.join(__dirname, '../_managed_files');
const CERTS_DIR = path.join(__dirname, '../certs');

// 确保文件目录存在
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
}

// 加载SSL证书
try {
    var options = {
        key: fs.readFileSync(path.join(CERTS_DIR, 'localhost-key.pem')),
        cert: fs.readFileSync(path.join(CERTS_DIR, 'localhost.pem'))
    };
} catch (error) {
    console.error('无法加载SSL证书，请确保已生成证书:', error);
    process.exit(1);
}

// 创建Express应用
const app = express();

// 中间件
app.use(bodyParser.json());

// CORS配置
app.use(cors({
    origin: 'https://text-editor-client.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// 健康检查端点
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

// 获取文件列表
app.get('/files', (req: Request, res: Response) => {
    try {
        const files = fs.readdirSync(FILES_DIR);
        // 只返回.txt文件
        const txtFiles = files.filter((file: string) =>
            file.endsWith('.txt') &&
            fs.statSync(path.join(FILES_DIR, file)).isFile()
        );
        res.json({ files: txtFiles });
    } catch (error) {
        console.error('读取文件列表错误:', error);
        res.status(500).json({ error: '读取文件列表失败' });
    }
});

// 读取文件内容
app.get('/files/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;

    // 安全检查 - 只允许.txt文件
    if (!filename.endsWith('.txt')) {
        return res.status(400).json({ error: '只允许操作.txt文件' });
    }

    const filePath = path.join(FILES_DIR, filename);

    try {
        // 检查文件是否存在
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            return res.status(404).json({ error: '文件不存在' });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        res.send(content);
    } catch (error) {
        console.error(`读取文件 ${filename} 错误:`, error);
        res.status(500).json({ error: `读取文件 ${filename} 失败` });
    }
});

// 创建新文件
app.post('/files', (req: Request, res: Response) => {
    const { filename, content = '' } = req.body;

    if (!filename) {
        return res.status(400).json({ error: '文件名不能为空' });
    }

    // 安全检查 - 只允许.txt文件
    if (!filename.endsWith('.txt')) {
        return res.status(400).json({ error: '只允许创建.txt文件' });
    }

    const filePath = path.join(FILES_DIR, filename);

    try {
        // 检查文件是否已存在
        if (fs.existsSync(filePath)) {
            return res.status(409).json({ error: '文件已存在' });
        }

        fs.writeFileSync(filePath, content, 'utf8');
        res.status(201).json({ message: `文件 ${filename} 创建成功` });
    } catch (error) {
        console.error(`创建文件 ${filename} 错误:`, error);
        res.status(500).json({ error: `创建文件 ${filename} 失败` });
    }
});

// 更新文件内容
app.put('/files/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;
    const { content } = req.body;

    if (content === undefined) {
        return res.status(400).json({ error: '文件内容不能为空' });
    }

    // 安全检查 - 只允许.txt文件
    if (!filename.endsWith('.txt')) {
        return res.status(400).json({ error: '只允许操作.txt文件' });
    }

    const filePath = path.join(FILES_DIR, filename);

    try {
        // 检查文件是否存在
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            return res.status(404).json({ error: '文件不存在' });
        }

        fs.writeFileSync(filePath, content, 'utf8');
        res.json({ message: `文件 ${filename} 更新成功` });
    } catch (error) {
        console.error(`更新文件 ${filename} 错误:`, error);
        res.status(500).json({ error: `更新文件 ${filename} 失败` });
    }
});

// 删除文件
app.delete('/files/:filename', (req: Request, res: Response) => {
    const { filename } = req.params;

    // 安全检查 - 只允许.txt文件
    if (!filename.endsWith('.txt')) {
        return res.status(400).json({ error: '只允许操作.txt文件' });
    }

    const filePath = path.join(FILES_DIR, filename);

    try {
        // 检查文件是否存在
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            return res.status(404).json({ error: '文件不存在' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: `文件 ${filename} 删除成功` });
    } catch (error) {
        console.error(`删除文件 ${filename} 错误:`, error);
        res.status(500).json({ error: `删除文件 ${filename} 失败` });
    }
});

// 创建HTTPS服务器
const server = https.createServer(options, app);

server.listen(PORT, () => {
    console.log(`本地服务运行在 https://localhost:${PORT}`);
    console.log(`文件存储目录: ${FILES_DIR}`);
});

// 处理服务器错误
server.on('error', (err: Error) => {
    console.error('服务器错误:', err);
});