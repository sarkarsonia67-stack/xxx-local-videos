const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, "uploads");
const DATA_DIR = path.join(ROOT, "data");
fs.mkdirSync(UPLOAD_DIR, {recursive:true});
fs.mkdirSync(DATA_DIR, {recursive:true});

const db = new Database(path.join(DATA_DIR, "platform.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'user',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS videos(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL,
 title TEXT NOT NULL,
 description TEXT DEFAULT '',
 category TEXT DEFAULT 'Other',
 filename TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',
 views INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS reports(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 video_id INTEGER NOT NULL,
 reporter_id INTEGER,
 reason TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(video_id) REFERENCES videos(id)
);
`);

const adminEmail = "admin@example.com";
if (!db.prepare("SELECT id FROM users WHERE email=?").get(adminEmail)) {
  const hash = bcrypt.hashSync("ChangeMe123!", 12);
  db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)")
    .run("Administrator", adminEmail, hash, "admin");
}

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(ROOT, "public")));
app.use("/uploads", express.static(UPLOAD_DIR, {maxAge:"1h"
 })
 );
app.get("/", (req, res) => {
  const indexFile = path.join(ROOT, "public", "index.html");

  if (!fs.existsSync(indexFile)) {
    return res.status(404).send(
      "index.html not found. Make sure public/index.html exists."
    );
  }

  res.sendFile(indexFile);
});
app.use(session({
  secret: process.env.SESSION_SECRET || "replace-this-secret-in-production",
  resave:false,
  saveUninitialized:false,
  cookie:{httpOnly:true, sameSite:"lax", secure:false, maxAge: 7*24*60*60*1000}
}));

const allowedMime = new Set(["video/mp4","video/webm","video/quicktime"]);
const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null,UPLOAD_DIR),
  filename:(req,file,cb)=>{
    const ext=path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID()+ext);
  }
});
const upload = multer({
  storage,
  limits:{fileSize: 500*1024*1024},
  fileFilter:(req,file,cb)=>cb(null, allowedMime.has(file.mimetype))
});

function user(req){ return req.session.user || null; }
function requireLogin(req,res,next){
  if(!user(req)) return res.redirect("/login.html?error=login");
  next();
}
function requireAdmin(req,res,next){
  if(!user(req) || user(req).role!=="admin") return res.status(403).send(page("Forbidden","<div class='card'><h2>403</h2><p>Admin access required.</p></div>"));
  next();
}
function page(title, body){
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="/style.css"></head><body><nav><a class="brand" href="/">18+ Video</a><div class="navlinks"><a href="/">Home</a><a href="/upload.html">Upload</a>${user()?`<a href="/dashboard">Dashboard</a>${user().role==="admin"?`<a href="/admin">Admin</a>`:""}<a href="/logout">Logout</a>`:`<a href="/login.html">Login</a><a href="/register.html">Register</a>`}</div></nav><main>${body}</main><footer>18+ age-gated platform • Respect consent, rights and local law.</footer></body></html>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

app.get("/api/me",(req,res)=>res.json({user:user()}));

app.post("/api/register", async (req,res)=>{
  const {name,email,password}=req.body;
  if(!name || !email || !password || password.length<8) return res.status(400).json({error:"Name, valid email and password of 8+ characters required."});
  try{
    const hash=await bcrypt.hash(password,12);
    const info=db.prepare("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)").run(name.trim(),email.trim().toLowerCase(),hash);
    req.session.user={id:Number(info.lastInsertRowid),name:name.trim(),email:email.trim().toLowerCase(),role:"user"};
    res.json({ok:true});
  }catch(e){res.status(400).json({error:"Email already registered."});}
});

app.post("/api/login", async (req,res)=>{
  const row=db.prepare("SELECT * FROM users WHERE email=?").get((req.body.email||"").trim().toLowerCase());
  if(!row || !(await bcrypt.compare(req.body.password||"",row.password_hash))) return res.status(401).json({error:"Invalid login."});
  req.session.user={id:row.id,name:row.name,email:row.email,role:row.role};
  res.json({ok:true,role:row.role});
});
app.get("/logout",(req,res)=>req.session.destroy(()=>res.redirect("/")));

app.post("/api/upload", requireLogin, upload.single("video"), (req,res)=>{
  if(!req.file) return res.status(400).json({error:"Select an MP4/WebM/MOV video up to 500MB."});
  const title=(req.body.title||"").trim();
  if(title.length<3){fs.unlinkSync(req.file.path);return res.status(400).json({error:"Title is required."});}
  db.prepare("INSERT INTO videos(user_id,title,description,category,filename,status) VALUES(?,?,?,?,?,?)")
    .run(user(req).id,title,(req.body.description||"").trim(),req.body.category||"Other",req.file.filename,"pending");
  res.json({ok:true,message:"Uploaded. It is pending moderation."});
});

app.get("/api/videos",(req,res)=>{
  const q=(req.query.q||"").trim();
  const rows=q
    ? db.prepare("SELECT v.*,u.name uploader FROM videos v JOIN users u ON u.id=v.user_id WHERE v.status='approved' AND (v.title LIKE ? OR v.description LIKE ? OR v.category LIKE ?) ORDER BY v.id DESC").all(`%${q}%`,`%${q}%`,`%${q}%`)
    : db.prepare("SELECT v.*,u.name uploader FROM videos v JOIN users u ON u.id=v.user_id WHERE v.status='approved' ORDER BY v.id DESC").all();
  res.json(rows);
});

app.get("/api/videos/:id",(req,res)=>{
  const v=db.prepare("SELECT v.*,u.name uploader FROM videos v JOIN users u ON u.id=v.user_id WHERE v.id=? AND v.status='approved'").get(req.params.id);
  if(!v)return res.status(404).json({error:"Not found"});
  db.prepare("UPDATE videos SET views=views+1 WHERE id=?").run(v.id);
  v.views++;
  res.json(v);
});

app.post("/api/videos/:id/report", requireLogin,(req,res)=>{
  const reason=(req.body.reason||"").trim();
  if(!reason)return res.status(400).json({error:"Reason required."});
  db.prepare("INSERT INTO reports(video_id,reporter_id,reason) VALUES(?,?,?)").run(req.params.id,user(req).id,reason);
  res.json({ok:true});
});

app.get("/dashboard",requireLogin,(req,res)=>{
  const rows=db.prepare("SELECT * FROM videos WHERE user_id=? ORDER BY id DESC").all(user(req).id);
  const cards=rows.map(v=>`<div class="card"><h3>${esc(v.title)}</h3><p>Status: <b>${esc(v.status)}</b> • ${v.views} views</p></div>`).join("")||"<p>No uploads yet.</p>";
  res.send(page("Dashboard",`<section class="hero"><h1>My Dashboard</h1><p>${esc(user(req).email)}</p></section>${cards}`));
});

app.get("/admin",requireAdmin,(req,res)=>{
  const videos=db.prepare("SELECT v.*,u.name uploader FROM videos v JOIN users u ON u.id=v.user_id ORDER BY v.id DESC").all();
  const reports=db.prepare("SELECT r.*,v.title FROM reports r JOIN videos v ON v.id=r.video_id ORDER BY r.id DESC").all();
  const table=videos.map(v=>`<tr><td>${v.id}</td><td>${esc(v.title)}</td><td>${esc(v.uploader)}</td><td>${esc(v.status)}</td><td><form class="inline" method="post" action="/admin/video/${v.id}/status"><select name="status"><option>pending</option><option>approved</option><option>rejected</option></select><button>Save</button></form><form class="inline" method="post" action="/admin/video/${v.id}/delete"><button class="danger">Delete</button></form></td></tr>`).join("");
  const reportRows=reports.map(r=>`<li>#${r.video_id} — ${esc(r.title)} — ${esc(r.reason)}</li>`).join("")||"<li>No reports.</li>";
  res.send(page("Admin",`<h1>Admin Panel</h1><div class="tablewrap"><table><tr><th>ID</th><th>Title</th><th>Uploader</th><th>Status</th><th>Actions</th></tr>${table}</table></div><div class="card"><h2>Reports</h2><ul>${reportRows}</ul></div>`));
});
app.post("/admin/video/:id/status",requireAdmin,(req,res)=>{
  db.prepare("UPDATE videos SET status=? WHERE id=?").run(req.body.status,req.params.id); res.redirect("/admin");
});
app.post("/admin/video/:id/delete",requireAdmin,(req,res)=>{
  const v=db.prepare("SELECT filename FROM videos WHERE id=?").get(req.params.id);
  if(v){const p=path.join(UPLOAD_DIR,v.filename);if(fs.existsSync(p))fs.unlinkSync(p);}
  db.prepare("DELETE FROM reports WHERE video_id=?").run(req.params.id);
  db.prepare("DELETE FROM videos WHERE id=?").run(req.params.id); res.redirect("/admin");
});

app.get("/watch/:id",(req,res)=>{
  const v=db.prepare("SELECT v.*,u.name uploader FROM videos v JOIN users u ON u.id=v.user_id WHERE v.id=? AND v.status='approved'").get(req.params.id);
  if(!v)return res.status(404).send(page("Not found","<div class='card'><h2>Video not found</h2></div>"));
  db.prepare("UPDATE videos SET views=views+1 WHERE id=?").run(v.id);
  res.send(page(v.title,`<div class="watch"><video controls playsinline preload="metadata" src="/uploads/${encodeURIComponent(v.filename)}"></video><h1>${esc(v.title)}</h1><p>${esc(v.description)}</p><p>${esc(v.category)} • ${v.views+1} views • Uploaded by ${esc(v.uploader)}</p>${user()?`<form id="reportForm" class="card"><h3>Report</h3><input name="reason" placeholder="Reason" required><button>Submit report</button></form>`:""}</div><script>document.getElementById('reportForm')?.addEventListener('submit',async e=>{e.preventDefault();const r=await fetch('/api/videos/${v.id}/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:e.target.reason.value})});alert((await r.json()).ok?'Report submitted.':'Could not submit report.');});</script>`));
});

app.listen(PORT,()=>console.log(`Server running on http://localhost:${PORT}`));
