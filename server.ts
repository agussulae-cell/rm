import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const DB_FILE = path.resolve(process.cwd(), "db.json");

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: [], parts: [], transactions: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ROUTES ===
  
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const db = readDb();
    const user = db.users.find((u: any) => u.username === username && u.password === password);
    
    if (user) {
      res.json({ success: true, user: { id: user.id, username: user.username, fullname: user.fullname, role: user.role } });
    } else {
      res.status(401).json({ success: false, message: "Username atau password salah" });
    }
  });

  app.get("/api/users", (req, res) => {
    const db = readDb();
    res.json(db.users.map((u: any) => ({ id: u.id, username: u.username, fullname: u.fullname, role: u.role })));
  });

  app.post("/api/users", (req, res) => {
    const { username, password, fullname, role } = req.body;
    const db = readDb();
    if (db.users.find((u: any) => u.username === username)) {
      return res.status(400).json({ success: false, message: "Username sudah ada" });
    }
    const newUser = { id: crypto.randomUUID(), username, password, fullname, role };
    db.users.push(newUser);
    writeDb(db);
    res.json({ success: true, user: newUser });
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { fullname, role, password } = req.body;
    const db = readDb();
    const idx = db.users.findIndex((u: any) => u.id === id);
    if (idx !== -1) {
      db.users[idx].fullname = fullname;
      db.users[idx].role = role;
      if (password) db.users[idx].password = password;
      writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const db = readDb();
    db.users = db.users.filter((u: any) => u.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  app.get("/api/parts", (req, res) => {
    const db = readDb();
    res.json(db.parts);
  });

  app.post("/api/parts", (req, res) => {
    const { partNo, partName, initialStock, minStock, maxStock, userId } = req.body;
    const db = readDb();
    if (db.parts.find((p: any) => p.partNo.toUpperCase() === partNo.toUpperCase())) {
      return res.status(400).json({ success: false, message: "Part No sudah ada" });
    }
    const newPart = { 
      id: crypto.randomUUID(), 
      partNo, 
      partName, 
      initialStock: Number(initialStock) || 0,
      minStock: Number(minStock) || 0,
      maxStock: Number(maxStock) || 0
    };
    db.parts.push(newPart);
    
    // Log history Master
    db.transactions.push({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: "LOG_MASTER",
      partId: newPart.id,
      qty: 0,
      userId
    });

    writeDb(db);
    res.json({ success: true, part: newPart });
  });

  app.post("/api/parts/bulk", (req, res) => {
    const { parts, userId } = req.body;
    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const db = readDb();
    let addedCount = 0;
    let updatedCount = 0;

    parts.forEach((item: any) => {
      if (!item.partNo || !item.partName) return;

      const existingPartIndex = db.parts.findIndex((p: any) => p.partNo.toUpperCase() === item.partNo.toUpperCase());
      
      if (existingPartIndex !== -1) {
        // Update existing
        db.parts[existingPartIndex] = {
          ...db.parts[existingPartIndex],
          partName: item.partName,
          initialStock: Number(item.initialStock) || 0,
          minStock: Number(item.minStock) || 0,
          maxStock: Number(item.maxStock) || 0
        };
        db.transactions.push({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type: "LOG_MASTER",
          partId: db.parts[existingPartIndex].id,
          qty: 0,
          userId,
          remark: "Update via CSV"
        });
        updatedCount++;
      } else {
        // Add new
        const newPart = {
          id: crypto.randomUUID(),
          partNo: item.partNo,
          partName: item.partName,
          initialStock: Number(item.initialStock) || 0,
          minStock: Number(item.minStock) || 0,
          maxStock: Number(item.maxStock) || 0
        };
        db.parts.push(newPart);
        db.transactions.push({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type: "LOG_MASTER",
          partId: newPart.id,
          qty: 0,
          userId,
          remark: "Insert via CSV"
        });
        addedCount++;
      }
    });

    writeDb(db);
    res.json({ success: true, message: `Sukses! ${addedCount} data baru, ${updatedCount} diupdate.` });
  });

  app.put("/api/parts/:id", (req, res) => {
    const { id } = req.params;
    const { partNo, partName, initialStock, minStock, maxStock, userId } = req.body;
    const db = readDb();
    const idx = db.parts.findIndex((p: any) => p.id === id);
    if (idx !== -1) {
      db.parts[idx] = { 
        ...db.parts[idx], 
        partNo, 
        partName, 
        initialStock: Number(initialStock) || 0,
        minStock: Number(minStock) || 0,
        maxStock: Number(maxStock) || 0
      };
      
      // Log history Master
      db.transactions.push({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: "LOG_MASTER",
        partId: id,
        qty: 0,
        userId
      });

      writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Part tidak ditemukan" });
    }
  });

  app.delete("/api/parts/:id", (req, res) => {
    const db = readDb();
    db.parts = db.parts.filter((p: any) => p.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  app.get("/api/transactions", (req, res) => {
    const db = readDb();
    const tx = db.transactions.map((t: any) => {
      const u = db.users.find((u: any) => u.id === t.userId);
      const p = db.parts.find((p: any) => p.id === t.partId);
      return {
        ...t,
        username: u ? u.username : "-",
        fullname: u ? u.fullname : "-",
        partNo: p ? p.partNo : "-",
        partName: p ? p.partName : "-"
      };
    });
    res.json(tx);
  });

  app.get("/api/transactions/part/:partId", (req, res) => {
    const { partId } = req.params;
    const db = readDb();
    const tx = db.transactions
      .filter((t: any) => t.partId === partId)
      .map((t: any) => {
        const u = db.users.find((u: any) => u.id === t.userId);
        const p = db.parts.find((p: any) => p.id === t.partId);
        return {
          ...t,
          username: u ? u.username : "-",
          fullname: u ? u.fullname : "-",
          partNo: p ? p.partNo : "-",
          partName: p ? p.partName : "-"
        };
      })
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8); // get last 8

    res.json(tx);
  });

  app.post("/api/transactions", (req, res) => {
    const { type, partId, qty, userId, remark } = req.body;
    const db = readDb();
    const newTx = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      partId,
      qty: Number(qty),
      userId,
      remark: remark || ""
    };
    db.transactions.push(newTx);
    writeDb(db);
    res.json({ success: true, transaction: newTx });
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { qty, userId } = req.body;
    const db = readDb();
    const idx = db.transactions.findIndex((t: any) => t.id === id);
    if (idx !== -1) {
      const oldQty = db.transactions[idx].qty;
      db.transactions[idx].qty = Number(qty);
      
      // Log revisi
      db.transactions.push({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: "LOG_REVISI",
        partId: db.transactions[idx].partId,
        qty: 0,
        userId,
        remark: `Rev: ${oldQty} -> ${qty}`
      });

      writeDb(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const db = readDb();
    db.transactions = db.transactions.filter((t: any) => t.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  app.get("/api/dashboard", (req, res) => {
    const db = readDb();
    const stockMap: Record<string, any> = {};

    db.parts.forEach((p: any) => {
      stockMap[p.id] = {
        id: p.id,
        partNo: p.partNo,
        partName: p.partName,
        initialStock: p.initialStock,
        minStock: p.minStock || 0,
        maxStock: p.maxStock || 0,
        totalIn: 0,
        totalOut: 0,
        currentStock: p.initialStock
      };
    });

    const shiftData = { s1_in: 0, s1_out: 0, s2_in: 0, s2_out: 0 };
    const todayTransactions: any[] = [];
    
    const getProdDate = (d: Date) => {
      const prod = new Date(d.getTime());
      if (prod.getHours() < 7) prod.setDate(prod.getDate() - 1);
      prod.setHours(0,0,0,0);
      return prod;
    };
    
    const todayProd = getProdDate(new Date());

    db.transactions.forEach((t: any) => {
      const sm = stockMap[t.partId];
      if (sm && (t.type === "IN" || t.type === "OUT")) {
        if (t.type === "IN") {
          sm.totalIn += t.qty;
          sm.currentStock += t.qty;
        } else if (t.type === "OUT") {
          sm.totalOut += t.qty;
          sm.currentStock -= t.qty;
        }
      }

      if (t.type === 'IN' || t.type === 'OUT') {
         const d = new Date(t.timestamp);
         if (getProdDate(d).getTime() === todayProd.getTime()) {
           const h = d.getHours();
           const m = d.getMinutes();
           // Shift 1: 07:00 - 19:29
           const isShift1 = (h > 7 || (h === 7 && m >= 0)) && (h < 19 || (h === 19 && m <= 29));
           
           if (isShift1 && t.type === 'IN') shiftData.s1_in += t.qty;
           if (isShift1 && t.type === 'OUT') shiftData.s1_out += t.qty;
           if (!isShift1 && t.type === 'IN') shiftData.s2_in += t.qty;
           if (!isShift1 && t.type === 'OUT') shiftData.s2_out += t.qty;

           const u = db.users.find((u: any) => u.id === t.userId);
           todayTransactions.push({
             ...t,
             shift: isShift1 ? 1 : 2,
             partNo: sm ? sm.partNo : "-",
             partName: sm ? sm.partName : "-",
             fullname: u ? u.fullname : "-"
           });
         }
      }
    });

    todayTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let overStockCount = 0;
    let criticalStockCount = 0;
    const items = Object.values(stockMap);
    
    items.forEach((s: any) => {
      if (s.maxStock > 0 && s.currentStock > s.maxStock) overStockCount++;
      if (s.minStock > 0 && s.currentStock <= s.minStock) criticalStockCount++;
    });

    res.json({ items, shiftData, overStockCount, criticalStockCount, todayTransactions });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
