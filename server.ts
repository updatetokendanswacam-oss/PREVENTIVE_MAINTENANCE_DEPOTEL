import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'depotel_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface AppAccountServer {
  id: string;
  name: string;
  email: string;
  role: 'ROLE_ADMIN' | 'ROLE_USER';
  status: 'AKTIF' | 'NONAKTIF';
  isGoogleConnected: boolean;
  avatarUrl?: string;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
}

interface DatabaseStructure {
  currentDashboard: any | null;
  history: any[];
  adminPin: string;
  users: AppAccountServer[];
  activeUserId: string;
}

const DEFAULT_ACCOUNTS: AppAccountServer[] = [
  {
    id: 'acc-admin-main',
    name: 'ADMIN DEPOTEL UTAMA',
    email: 'updatetokendanswacam@gmail.com',
    role: 'ROLE_ADMIN',
    status: 'AKTIF',
    isGoogleConnected: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    department: 'Operations & Management DEPOTEL',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'acc-user-field',
    name: 'USER OPERASIONAL NOP',
    email: 'field.depotel@gmail.com',
    role: 'ROLE_USER',
    status: 'AKTIF',
    isGoogleConnected: true,
    department: 'Team Lapangan Southern',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'acc-user-junaedi',
    name: 'MUHAMAD JUNAEDI (TEAM 2)',
    email: 'junaedi.depotel@gmail.com',
    role: 'ROLE_USER',
    status: 'AKTIF',
    isGoogleConnected: false,
    department: 'Field Coordinator',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
];

function loadDatabase(): DatabaseStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const users = Array.isArray(parsed.users) && parsed.users.length > 0
        ? parsed.users
        : DEFAULT_ACCOUNTS;
      const activeUserId = parsed.activeUserId || users[0].id;

      return {
        currentDashboard: parsed.currentDashboard || null,
        history: Array.isArray(parsed.history) ? parsed.history : [],
        adminPin: parsed.adminPin || '1234',
        users,
        activeUserId,
      };
    }
  } catch (error) {
    console.error('Failed to read database file:', error);
  }
  return {
    currentDashboard: null,
    history: [],
    adminPin: '1234',
    users: DEFAULT_ACCOUNTS,
    activeUserId: DEFAULT_ACCOUNTS[0].id,
  };
}

function saveDatabase(db: DatabaseStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write database file:', error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Router
  const apiRouter = express.Router();

  // GET /api/dashboard
  apiRouter.get('/dashboard', (req: Request, res: Response) => {
    const db = loadDatabase();
    res.json({
      success: true,
      data: db.currentDashboard,
      adminPin: db.adminPin,
    });
  });

  // POST /api/dashboard
  apiRouter.post('/dashboard', (req: Request, res: Response) => {
    const { dashboard, snapshotHistory } = req.body;
    if (!dashboard) {
      res.status(400).json({ success: false, error: 'Dashboard data is required' });
      return;
    }

    const db = loadDatabase();
    db.currentDashboard = dashboard;

    if (snapshotHistory) {
      const existingIdx = db.history.findIndex((h) => h.id === dashboard.id);
      if (existingIdx >= 0) {
        db.history[existingIdx] = dashboard;
      } else {
        db.history.unshift(dashboard);
      }
    }

    saveDatabase(db);
    res.json({ success: true, message: 'Berhasil diperbarui' });
  });

  // GET /api/reports (History)
  apiRouter.get('/reports', (req: Request, res: Response) => {
    const db = loadDatabase();
    res.json({ success: true, data: db.history });
  });

  // POST /api/reports (Save/Snapshot to History)
  apiRouter.post('/reports', (req: Request, res: Response) => {
    const { report } = req.body;
    if (!report || !report.id) {
      res.status(400).json({ success: false, error: 'Report data with valid ID is required' });
      return;
    }

    const db = loadDatabase();
    const existingIdx = db.history.findIndex((h) => h.id === report.id);
    if (existingIdx >= 0) {
      db.history[existingIdx] = report;
    } else {
      db.history.unshift(report);
    }

    saveDatabase(db);
    res.json({ success: true, message: 'Berhasil disimpan ke riwayat' });
  });

  // DELETE /api/reports/:id
  apiRouter.delete('/reports/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();
    db.history = db.history.filter((h) => h.id !== id);
    saveDatabase(db);
    res.json({ success: true, message: 'Berhasil dihapus dari riwayat' });
  });

  // POST /api/reset
  apiRouter.post('/reset', (req: Request, res: Response) => {
    const db = loadDatabase();
    db.currentDashboard = null;
    saveDatabase(db);
    res.json({ success: true, message: 'Data berhasil direset' });
  });

  // POST /api/verify-pin
  apiRouter.post('/verify-pin', (req: Request, res: Response) => {
    const { pin } = req.body;
    const db = loadDatabase();
    if (pin === db.adminPin) {
      res.json({ success: true, message: 'PIN Valid' });
    } else {
      res.status(401).json({ success: false, error: 'PIN Admin Salah' });
    }
  });

  // POST /api/update-pin
  apiRouter.post('/update-pin', (req: Request, res: Response) => {
    const { oldPin, newPin } = req.body;
    const db = loadDatabase();
    if (oldPin !== db.adminPin) {
      res.status(401).json({ success: false, error: 'PIN lama salah' });
      return;
    }
    db.adminPin = newPin;
    saveDatabase(db);
    res.json({ success: true, message: 'PIN Admin berhasil diperbarui' });
  });

  // GET /api/users
  apiRouter.get('/users', (req: Request, res: Response) => {
    const db = loadDatabase();
    res.json({
      success: true,
      users: db.users,
      activeUserId: db.activeUserId,
    });
  });

  // POST /api/users (Add or Update Account)
  apiRouter.post('/users', (req: Request, res: Response) => {
    const { id, name, email, role, status, isGoogleConnected, department } = req.body;
    if (!name || !email) {
      res.status(400).json({ success: false, error: 'Nama dan Email Google wajib diisi' });
      return;
    }

    const db = loadDatabase();
    const cleanEmail = String(email).trim().toLowerCase();
    const existingIdx = id ? db.users.findIndex((u) => u.id === id) : db.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

    if (existingIdx >= 0) {
      // Update existing
      db.users[existingIdx] = {
        ...db.users[existingIdx],
        name: name.trim(),
        email: cleanEmail,
        role: role || db.users[existingIdx].role,
        status: status || db.users[existingIdx].status,
        isGoogleConnected: isGoogleConnected !== undefined ? isGoogleConnected : db.users[existingIdx].isGoogleConnected,
        department: department || db.users[existingIdx].department,
        lastLoginAt: new Date().toISOString(),
      };
      saveDatabase(db);
      res.json({ success: true, message: 'Akun berhasil diperbarui', account: db.users[existingIdx] });
    } else {
      // Create new account with immediate connection
      const newAcc: AppAccountServer = {
        id: `acc-${Date.now()}`,
        name: name.trim(),
        email: cleanEmail,
        role: role === 'ROLE_ADMIN' ? 'ROLE_ADMIN' : 'ROLE_USER',
        status: status === 'NONAKTIF' ? 'NONAKTIF' : 'AKTIF',
        isGoogleConnected: isGoogleConnected !== undefined ? Boolean(isGoogleConnected) : true,
        department: department || (role === 'ROLE_ADMIN' ? 'Admin Team' : 'Field Team'),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.users.push(newAcc);
      // DO NOT switch active user when adding account; retain current ADMIN DEPOTEL UTAMA session
      saveDatabase(db);
      res.json({ success: true, message: 'Akun baru berhasil ditambahkan', account: newAcc });
    }
  });

  // POST /api/users/toggle-status
  apiRouter.post('/users/toggle-status', (req: Request, res: Response) => {
    const { id } = req.body;
    const db = loadDatabase();
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Akun tidak ditemukan' });
      return;
    }
    user.status = user.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    saveDatabase(db);
    res.json({ success: true, message: `Status akun diubah menjadi ${user.status}`, account: user });
  });

  // POST /api/users/switch
  apiRouter.post('/users/switch', (req: Request, res: Response) => {
    const { id } = req.body;
    const db = loadDatabase();
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Akun tidak ditemukan' });
      return;
    }
    user.lastLoginAt = new Date().toISOString();
    db.activeUserId = id;
    saveDatabase(db);
    res.json({ success: true, message: `Berhasil masuk sebagai ${user.name}`, activeUser: user });
  });

  // POST /api/users/google-login
  apiRouter.post('/users/google-login', (req: Request, res: Response) => {
    const { email, name } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email Google diperlukan' });
      return;
    }
    const db = loadDatabase();
    const cleanEmail = String(email).trim().toLowerCase();
    let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user) {
      user.isGoogleConnected = true;
      user.status = 'AKTIF';
      user.lastLoginAt = new Date().toISOString();
      if (name) user.name = name.trim();
    } else {
      // Create new account from Google sign-in
      const isAdminEmail = cleanEmail.includes('admin') || cleanEmail.includes('swacam') || cleanEmail.includes('depotel');
      user = {
        id: `acc-google-${Date.now()}`,
        name: name ? name.trim() : cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        role: isAdminEmail ? 'ROLE_ADMIN' : 'ROLE_USER',
        status: 'AKTIF',
        isGoogleConnected: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.users.push(user);
    }

    db.activeUserId = user.id;
    saveDatabase(db);
    res.json({ success: true, message: `Berhasil terhubung dengan Google (${user.email})`, activeUser: user });
  });

  // DELETE /api/users/:id
  apiRouter.delete('/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDatabase();

    const targetUser = db.users.find((u) => u.id === id);
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Akun tidak ditemukan di database' });
      return;
    }

    if (targetUser.id === 'acc-admin-main' || targetUser.email.toLowerCase() === 'updatetokendanswacam@gmail.com') {
      res.status(403).json({ success: false, error: 'Akun ADMIN DEPOTEL UTAMA terlindungi dan tidak dapat dihapus' });
      return;
    }

    if (db.users.length <= 1) {
      res.status(400).json({ success: false, error: 'Tidak dapat menghapus akun terakhir di sistem' });
      return;
    }

    db.users = db.users.filter((u) => u.id !== id);
    if (db.activeUserId === id) {
      const adminMain = db.users.find((u) => u.id === 'acc-admin-main') || db.users[0];
      db.activeUserId = adminMain.id;
    }
    saveDatabase(db);
    res.json({ success: true, message: `Akun ${targetUser.name} berhasil dihapus permanen` });
  });

  // GET /api/sites (Read attached Telkomsel Site CSV or fallback to remote)
  let siteCache: any[] | null = null;

  function parseCsvText(text: string): any[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const sites: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV quote handler
      const parts: string[] = [];
      let cur = '';
      let inQuote = false;
      for (let j = 0; j < line.length; j++) {
        const c = line[j];
        if (c === '"') {
          inQuote = !inQuote;
        } else if (c === ',' && !inQuote) {
          parts.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      parts.push(cur.trim());

      if (parts.length >= 2) {
        const siteName = parts[0];
        const siteId = parts[1];
        if (siteId || siteName) {
          const latStr = parts[26] || parts[14] || '';
          const lngStr = parts[25] || parts[13] || '';

          const latNum = parseFloat(latStr.replace(',', '.'));
          const lngNum = parseFloat(lngStr.replace(',', '.'));

          sites.push({
            siteId: siteId ? siteId.toUpperCase() : siteName.toUpperCase(),
            siteName: siteName ? siteName.toUpperCase() : siteId.toUpperCase(),
            siteOwner: parts[2] || '',
            province: parts[3] || '',
            city: parts[4] || '',
            area: parts[5] || '',
            regional: parts[6] || '',
            nop: parts[7] || '',
            cluster: parts[8] || '',
            subdistrict: parts[9] || '', // Kecamatan
            village: parts[10] || '',   // Kelurahan
            typeSite: parts[11] || '',
            siteClass: parts[17] || '',
            active: parts[18] === 'TRUE',
            lastMaintenanceSite: parts[19] || '',
            gensetType: parts[20] || '',
            gensetCapacity: parts[22] || '',
            lastMaintenanceGenset: parts[23] || '',
            lat: !isNaN(latNum) && latNum !== 0 ? latNum : undefined,
            lng: !isNaN(lngNum) && lngNum !== 0 ? lngNum : undefined,
          });
        }
      }
    }
    return sites;
  }

  apiRouter.get('/sites', async (req: Request, res: Response) => {
    if (siteCache && siteCache.length > 0) {
      res.json({ success: true, sites: siteCache });
      return;
    }

    // 1. Try reading local asset file
    const localAssetPath = path.resolve(process.cwd(), 'public', 'assets', 'aistudio', 'Site_Telkomsel_0a203713');
    try {
      if (fs.existsSync(localAssetPath)) {
        const fileContent = fs.readFileSync(localAssetPath, 'utf-8');
        const parsedSites = parseCsvText(fileContent);
        if (parsedSites.length > 0) {
          siteCache = parsedSites;
          res.json({ success: true, sites: siteCache });
          return;
        }
      }
    } catch (e) {
      console.error('Error reading local site asset:', e);
    }

    // 2. Fallback to remote Google Sheet CSV
    try {
      const csvUrl = 'https://docs.google.com/spreadsheets/d/1KFQ8WY4NNFAnPuzMYwKnJW9GyvmuPYFfLyk2u8If5AU/export?format=csv';
      const response = await fetch(csvUrl);
      if (response.ok) {
        const text = await response.text();
        const parsedSites = parseCsvText(text);
        siteCache = parsedSites;
        res.json({ success: true, sites: siteCache });
        return;
      }
    } catch (err) {
      console.error('Error fetching remote site CSV:', err);
    }

    res.json({ success: true, sites: siteCache || [] });
  });

  app.use('/api', apiRouter);

  // Vite development or Static production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DEPOTEL Daily Reporting Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
