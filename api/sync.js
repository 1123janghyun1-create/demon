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
  accounts: {},
};

const FILE_MAP = {
  products: 'products.json',
  builders: 'builders_data.json',
  feedbacks: 'feedbacks_data.json',
  community: 'community_data.json',
  accounts: 'accounts_data.json',
  notifications: 'notifications_data.json',
  messages: 'messages_data.json',
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

      // DM: Only participants (sender/receiver) can view their messages
      if (table === 'messages') {
        const { userId, email } = req.query || {};
        if (!userId && !email) {
          return res.status(200).json({ success: true, data: [] });
        }
        const cleanId = (userId || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();
        const allMsgs = readData('messages', []);
        const filtered = allMsgs.filter((m) => {
          if (m.senderId === 'SYSTEM_AUTH' || m.senderId === 'DELETED') return false;
          const isSender =
            (cleanId && m.senderId === cleanId) ||
            (cleanEmail && (m.senderId || '').toLowerCase() === cleanEmail);
          const isReceiver =
            (cleanId && m.receiverId === cleanId) ||
            (cleanEmail && (m.receiverId || '').toLowerCase() === cleanEmail);
          return isSender || isReceiver;
        });
        return res.status(200).json({ success: true, data: filtered });
      }

      // Notifications: returns targeted notifications for user + global platform activities
      if (table === 'notifications') {
        const { userId, email } = req.query || {};
        const cleanId = (userId || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();
        const allNotifs = readData('notifications', []);
        const filtered = allNotifs.filter((n) => {
          if (!n.userId || n.userId === 'ALL') return true;
          if (cleanId && n.userId === cleanId) return true;
          if (cleanEmail && (n.userId || '').toLowerCase() === cleanEmail) return true;
          return false;
        });
        return res.status(200).json({ success: true, data: filtered });
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
          list = list.filter((p) => p.id !== data.id && p.slug !== data.id && (!data.slug || p.slug !== data.slug));
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

        if (action === 'bump') {
          const nowIso = data.bumpedAt || new Date().toISOString();
          list = list.map((p) =>
            p.id === data.id
              ? { ...p, bumpedAt: nowIso, createdAtRaw: nowIso, createdAt: '방금 전' }
              : p
          );
          list.sort(
            (a, b) =>
              new Date(b.bumpedAt || b.createdAtRaw || b.createdAt || 0).getTime() -
              new Date(a.bumpedAt || a.createdAtRaw || a.createdAt || 0).getTime()
          );
          writeData('products', list);
          return res.status(200).json({ success: true, data: list });
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
        if (action === 'increment_likes') {
          list = list.map((item) => (item.id === data.id ? { ...item, likes: (item.likes || 0) + 1 } : item));
          writeData('community', list);
          return res.status(200).json({ success: true, data: list });
        }
        if (action === 'decrement_likes') {
          list = list.map((item) => (item.id === data.id ? { ...item, likes: Math.max(0, (item.likes || 0) - 1) } : item));
          writeData('community', list);
          return res.status(200).json({ success: true, data: list });
        }
      }

      if (table === 'messages') {
        let msgList = readData('messages', []);
        if (action === 'insert') {
          msgList.push(data);
          writeData('messages', msgList);
          return res.status(200).json({ success: true, data });
        }
      }

      if (table === 'notifications') {
        let notifList = readData('notifications', []);

        if (action === 'insert') {
          notifList = [data, ...notifList].slice(0, 200);
          writeData('notifications', notifList);
          return res.status(200).json({ success: true, data });
        }

        if (action === 'mark_read') {
          notifList = notifList.map((n) => (n.id === data.id ? { ...n, read: true } : n));
          writeData('notifications', notifList);
          return res.status(200).json({ success: true, data: notifList });
        }

        if (action === 'mark_all_read') {
          const { userId, email } = data || {};
          const cleanId = (userId || '').trim();
          const cleanEmail = (email || '').trim().toLowerCase();
          notifList = notifList.map((n) => {
            const matches =
              (cleanId && n.userId === cleanId) ||
              (cleanEmail && (n.userId || '').toLowerCase() === cleanEmail) ||
              !n.userId;
            return matches ? { ...n, read: true } : n;
          });
          writeData('notifications', notifList);
          return res.status(200).json({ success: true, data: notifList });
        }

        if (action === 'delete') {
          notifList = notifList.filter((n) => n.id !== data.id);
          writeData('notifications', notifList);
          return res.status(200).json({ success: true, data: notifList });
        }

        if (action === 'clear_all') {
          const { userId, email } = data || {};
          const cleanId = (userId || '').trim();
          const cleanEmail = (email || '').trim().toLowerCase();
          notifList = notifList.filter((n) => {
            const matches =
              (cleanId && n.userId === cleanId) ||
              (cleanEmail && (n.userId || '').toLowerCase() === cleanEmail);
            return !matches;
          });
          writeData('notifications', notifList);
          return res.status(200).json({ success: true, data: notifList });
        }
      }

      if (table === 'accounts') {
        let accountsMap = readData('accounts', {});
        const email = (data?.email || '').trim().toLowerCase();

        if (action === 'register') {
          if (!email) {
            return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });
          }
          if (accountsMap[email]) {
            return res.status(400).json({
              success: false,
              alreadyExists: true,
              message: '이미 가입된 이메일 계정입니다. 설정하셨던 비밀번호로 로그인해주세요.',
            });
          }

          const newAccount = {
            id: data.id || 'builder-' + Date.now(),
            email,
            password: data.password,
            name: data.name || email.split('@')[0],
            avatar: data.avatar || '/demon-mascot.png',
            role: data.role || '인디 메이커',
            createdAt: new Date().toISOString(),
          };

          accountsMap[email] = newAccount;
          writeData('accounts', accountsMap);

          // Also ensure registered in builders list
          let bList = readData('builders', []);
          const bIdx = bList.findIndex((b) => b.email === email);
          if (bIdx === -1) {
            bList.push({
              id: newAccount.id,
              name: newAccount.name,
              email: newAccount.email,
              avatar: newAccount.avatar,
              role: newAccount.role,
              bio: 'demonst 사이드 프로젝트 메이커입니다.',
              tags: ['개발자', 'SaaS', 'AI'],
              followersCount: 0,
              followingCount: 0,
            });
            writeData('builders', bList);
          }

          return res.status(200).json({
            success: true,
            user: {
              id: newAccount.id,
              email: newAccount.email,
              name: newAccount.name,
              avatar: newAccount.avatar,
              role: newAccount.role,
            },
          });
        }

        if (action === 'verify') {
          if (!email) {
            return res.status(400).json({ success: false, message: '이메일을 입력해주세요.' });
          }

          const existing = accountsMap[email];
          if (!existing) {
            return res.status(404).json({
              success: false,
              notFound: true,
              message: '등록되지 않은 이메일 계정입니다. 회원가입을 먼저 진행해주세요.',
            });
          }

          if (existing.password !== data.password) {
            return res.status(401).json({
              success: false,
              wrongPassword: true,
              message: '비밀번호가 일치하지 않습니다. 해당 계정에 설정하셨던 실제 비밀번호를 다시 확인해주세요.',
            });
          }

          return res.status(200).json({
            success: true,
            user: {
              id: existing.id,
              email: existing.email,
              name: existing.name,
              avatar: existing.avatar,
              role: existing.role,
            },
          });
        }

        if (action === 'get') {
          const existing = accountsMap[email];
          return res.status(200).json({
            success: true,
            exists: Boolean(existing),
            user: existing
              ? { id: existing.id, email: existing.email, name: existing.name, avatar: existing.avatar, role: existing.role }
              : null,
          });
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
