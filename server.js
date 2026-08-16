const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const DATA_FILE = './data.json';

// 读取留言数据
// 强制从空数组开始，忽略旧数据
let messages = [];
if (fs.existsSync(DATA_FILE)) {
    // 如果有旧文件，直接删掉重建
    fs.unlinkSync(DATA_FILE);
}
fs.writeFileSync(DATA_FILE, JSON.stringify(messages));

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API 路由：获取留言
    if (req.method === 'GET' && pathname === '/msgs') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(messages));
        return;
    }

    // API 路由：发布留言
    if (req.method === 'POST' && pathname === '/msgs') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const newMsg = JSON.parse(body);
    const msgToSave = {
    text: newMsg.text,
    name: newMsg.name || '匿名',  // 如果没传名字，默认“匿名”
    time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
};
                messages.push(msgToSave);
                saveData();
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, messages: messages }));
            } catch (e) {
                res.writeHead(400);
                res.end('格式错误');
            }
        });
        return;
    }

    // ✅ 新增：静态文件服务（处理图片、CSS等）
    const filePath = path.join(__dirname, pathname);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 文件不存在时，返回 index.html（让前端路由继续工作）
            fs.readFile('./index.html', (err2, indexData) => {
                if (err2) {
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(indexData);
            });
            return;
        }

        // 根据文件扩展名返回正确的 MIME 类型
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.json': 'application/json',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('✅ 云留言板已启动（带静态文件服务）！');
});