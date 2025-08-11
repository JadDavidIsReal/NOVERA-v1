// proxy.js
const express = require('express');
const { request } = require('undici');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/qwen', async (req, res) => {
  const response = await request('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk-59ed0f89501a44e295baa83a1f520406',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  });
  const data = await response.body.json();
  res.json(data);
});

app.listen(3001, () => console.log('Proxy running on http://localhost:3001'));