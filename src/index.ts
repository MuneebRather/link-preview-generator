import express from 'express';
import { getLinkPreview } from 'link-preview-js';

const app = express();
app.use(express.json());

interface PreviewResult {
  title?: string;
  description?: string;
  images?: string[];
  siteName?: string;
}

// Browser-friendly GET page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Link Preview Generator</title>
      <style>
        body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; background: #1a1a2e; color: #eee; }
        h1 { color: #e94560; }
        input { width: 100%; padding: 10px; font-size: 16px; border: none; border-radius: 8px; margin: 10px 0; }
        button { padding: 10px 20px; background: #533483; color: white; border: none; border-radius: 8px; cursor: pointer; }
        button:hover { background: #7b2cbf; }
        #result { margin-top: 20px; padding: 20px; background: #16213e; border-radius: 12px; display: none; }
        img { max-width: 100%; border-radius: 8px; margin-top: 10px; }
        .field { margin: 8px 0; }
        .label { color: #aaa; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; }
      </style>
    </head>
    <body>
      <h1>🔗 Link Preview Generator</h1>
      <p>Paste a URL to extract title, description, and image.</p>
      <input type="text" id="url" placeholder="https://github.com" value="https://github.com">
      <button onclick="fetchPreview()">Generate Preview</button>
      <div id="result">
        <div class="field"><div class="label">Title</div><div class="value" id="title"></div></div>
        <div class="field"><div class="label">Description</div><div class="value" id="desc"></div></div>
        <div class="field"><div class="label">Site</div><div class="value" id="site"></div></div>
        <img id="img" style="display:none">
      </div>
      <script>
        async function fetchPreview() {
          const url = document.getElementById('url').value;
          const res = await fetch('/preview', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({url})
          });
          const data = await res.json();
          document.getElementById('result').style.display = 'block';
          document.getElementById('title').textContent = data.title || 'N/A';
          document.getElementById('desc').textContent = data.description || 'N/A';
          document.getElementById('site').textContent = data.siteName || 'N/A';
          const img = document.getElementById('img');
          if (data.image) { img.src = data.image; img.style.display = 'block'; }
          else { img.style.display = 'none'; }
        }
      </script>
    </body>
    </html>
  `);
});

// API endpoint (POST)
app.post('/preview', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }
  try {
    const preview = await getLinkPreview(url, {
      followRedirects: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'accept-encoding': 'gzip, deflate, br'
      }
    }) as PreviewResult;
    res.json({
      title: preview.title || 'No title',
      description: preview.description || 'No description',
      image: preview.images?.[0] || null,
      siteName: preview.siteName || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch preview', details: (err as Error).message });
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`Server on port ${PORT}`));