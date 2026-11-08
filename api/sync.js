// api/sync.js
// Multi-browser, multi-account persistent server synchronization engine
// Works both in local Vite dev server and on Vercel Serverless

import fs from 'fs';
import path from 'path';

// Memory fallback cache in case filesystem is completely read-only
let memoryCache = {
  products: [],
  builders: [],
  feedbacks: {},
  community: [],
  messages: {},
  notifications: [],
};

const FILE_MAP = {
  products: 'products.json',
  builders: 'builders_data.json',
  feedbacks: 'feedbacks_data.json',
  community: 'community_data.json',
};

function getFilePath(tableName) {
  const filename = FILE_MAP[tableName];
  if (!filename) return null;
  return path.join(process.cwd(), 'src', 'data', filename);
}

function readData(tableName, defaultValue = []) {
  if (memoryCache[tableName] && (Array.isArray(memoryCache[tableName]) ? memoryCache[tableName].length > 0 : Object.keys(memoryCache[tableName]).length > 0)) {
    return memoryCache[tableName];
  }

  const filePath = getFilePath(tableName);
  if (filePath && fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryCache[tableName] = parsed;
      return parsed;
    } catch (err) {
      console.warn(`Error reading ${tableName} file:`, err);
    }
  }

  return defaultValue;
}

function writeData(tableName, data) {
  memoryCache[tableName] = data;

  const filePath = getFilePath(tableName);
  if (filePath) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      // In read-only serverless environments, memory cache still holds the data
      console.warn(`Could not write to disk for ${tableName}:`, err.message);
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { table = 'all' } = req.query || {};

      if (table === 'all') {
        const payload = {
          products: readData('products', []),
          builders: readData('builders', []),
          feedbacks: readData('feedbacks', {}),
          community: readData('community', []),
        };
        return res.status(200).json({ success: true, data: payload });
      }

      if (table === 'products') {
        return res.status(200).json({ success: true, data: readData('products', []) });
      }

      if (table === 'builders') {
        return res.status(200).json({ success: true, data: readData('builders', []) });
      }

      if (table === 'feedbacks') {
        return res.status(200).json({ success: true, data: readData('feedbacks', {}) });
      }

      if (table === 'community') {
        return res.status(200).json({ success: true, data: readData('community', []) });
      }

      return res.status(400).json({ success: false, message: 'Invalid table requested' });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }

      const { table, action, data } = body || {};

      if (action === 'reset_all' || table === 'reset_all') {
        memoryCache = {
          products: [],
          builders: [],
          feedbacks: {},
          community: [],
          messages: {},
          notifications: [],
        };
        writeData('products', []);
        writeData('builders', []);
        writeData('feedbacks', {});
        writeData('community', []);
        return res.status(200).json({ success: true, message: 'All tables reset' });
      }

      if (!table || !action) {
        return res.status(400).json({ success: false, message: 'Missing table or action' });
      }

      if (table === 'products') {
        let list = readData('products', []);

        if (action === 'insert') {
          // Check if already exists by id
          const existingIdx = list.findIndex((p) => p.id === data.id);
          if (existingIdx !== -1) {
            list[existingIdx] = { ...list[existingIdx], ...data };
          } else {
            list = [data, ...list];
          }
          writeData('products', list);
          return res.status(200).json({ success: true, data: list });
        }

        if (action === 'update') {
          list = list.map((p) => (p.id === data.id ? { ...p, ...data } : p));
          writeData('products', list);
          return res.status(200).json({ success: true, data: list });
        }

        if (action === 'delete') {
          list = list.filter((p) => p.id !== data.id);
          writeData('products', list);
          return res.status(200).json({ success: true, data: list });
        }

        if (action === 'increment_view') {
          list = list.map((p) => (p.id === data.id ? { ...p, views: (p.views || 0) + 1 } : p));
          writeData('products', list);
          return res.status(200).json({ success: true });
        }

        if (action === 'increment_upvote') {
          list = list.map((p) => (p.id === data.id ? { ...p, upvotes: (p.upvotes || 0) + 1 } : p));
          writeData('products', list);
          return res.status(200).json({ success: true });
        }

        if (action === 'decrement_upvote') {
          list = list.map((p) => (p.id === data.id ? { ...p, upvotes: Math.max(0, (p.upvotes || 0) - 1) } : p));
          writeData('products', list);
          return res.status(200).json({ success: true });
        }
      }

      if (table === 'builders') {
        let list = readData('builders', []);
        if (action === 'upsert') {
          const idx = list.findIndex((b) => b.id === data.id || (b.email && b.email === data.email));
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...data };
          } else {
            list = [data, ...list];
          }
          writeData('builders', list);
          return res.status(200).json({ success: true, data: list });
        }
      }

      if (table === 'feedbacks') {
        let map = readData('feedbacks', {});
        const pId = data.productId;

        if (action === 'insert') {
          if (!map[pId]) map[pId] = [];
          // Prepend feedback
          map[pId] = [data, ...map[pId]];
          writeData('feedbacks', map);

          // Also increment product feedbackCount
          let pList = readData('products', []);
          pList = pList.map((p) => (p.id === pId ? { ...p, feedbackCount: (p.feedbackCount || 0) + 1 } : p));
          writeData('products', pList);

          return res.status(200).json({ success: true, data: map });
        }

        if (action === 'delete') {
          if (map[pId]) {
            map[pId] = map[pId].filter((f) => f.id !== data.id);
            writeData('feedbacks', map);
          }
          return res.status(200).json({ success: true, data: map });
        }
      }

      if (table === 'community') {
        let list = readData('community', []);
        if (action === 'insert') {
          list = [data, ...list];
          writeData('community', list);
          return res.status(200).json({ success: true, data: list });
        }
        if (action === 'delete') {
          list = list.filter((item) => item.id !== data.id);
          writeData('community', list);
          return res.status(200).json({ success: true, data: list });
        }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API sync error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
