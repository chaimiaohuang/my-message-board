const http = require('http');
const fs = require('fs');
const url = require('url');

const DATA_FILE = './data.json';

// 读取存档
let messages = [];
if (fs.existsSync(DATA_FILE)) {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        messages = JSON.parse(content);
    } catch (e) { messages = []; }
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
}

function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    if (req.method === 'GET' && path === '/') {
        fs.readFile('./index.html', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('找不到 index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    if (req.method === 'GET' && path === '/msgs') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(messages));
        return;
    }

    if (req.method === 'POST' && path === '/msgs') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const newMsg = JSON.parse(body);
                // 【核心改动】不再只存文字，而是存一个“档案袋”！
                // 包含 text（文字）和 time（当前北京时间）
                const msgToSave = {
                    text: newMsg.text,
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

    res.writeHead(404);
    res.end('Not Found');
});

server.listen(3000, '0.0.0.0', () => {
    console.log('✅ 云留言板已启动（带时间版本）！');
});