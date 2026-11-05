import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { db } from './db.js';
dotenv.config();
const app=express(); app.use(cors()); app.use(express.json({limit:'5mb'}));
const PORT=process.env.PORT||4000, SECRET=process.env.JWT_SECRET||'dev-only-change-me';
const uploadDir=path.resolve('uploads');fs.mkdirSync(uploadDir,{recursive:true});
const imageUpload=multer({storage:multer.diskStorage({destination:(_req,_file,cb)=>cb(null,uploadDir),filename:(_req,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase();cb(null,`${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)}}),limits:{fileSize:8*1024*1024},fileFilter:(_req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype))});
app.use('/uploads',express.static(uploadDir));
const safe=u=>({id:u.id,name:u.name,email:u.email,role:u.role,phone:u.phone,available:!!u.available});
const notify=(uid,title,message,type='info')=>db.prepare('INSERT INTO notifications(user_id,title,message,type) VALUES(?,?,?,?)').run(uid,title,message,type);
const auth=(req,res,next)=>{try{const t=(req.headers.authorization||'').replace('Bearer ','');req.user=jwt.verify(t,SECRET);next()}catch{return res.status(401).json({error:'Please sign in again.'})}};
const role=(...roles)=>(req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({error:'You do not have permission.'});
app.get('/api/health',(req,res)=>res.json({ok:true,service:'Waste Collector API'}));
app.post('/api/uploads/house-photo',auth,role('resident'),(req,res)=>{
 imageUpload.single('photo')(req,res,(err)=>{
  if(err)return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'Photo must be 8 MB or smaller.':err.message||'Invalid image file.'});
  if(!req.file)return res.status(400).json({error:'Choose a JPG, PNG or WEBP photo.'});
  res.status(201).json({photoUrl:`${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`});
 });
});
app.post('/api/auth/register',(req,res)=>{
 const {name,email,password,phone,address,latitude,longitude,householdName,photoUrl}=req.body;
 if(!name?.trim()||!email?.trim()||!password||password.length<8||!householdName?.trim()||!address?.trim())
  return res.status(400).json({error:'Name, valid email, password (8+ characters), household name and address are required.'});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return res.status(400).json({error:'Please provide a valid email address.'});
 if(!Number.isFinite(Number(latitude))||!Number.isFinite(Number(longitude))||Number(latitude)<-90||Number(latitude)>90||Number(longitude)<-180||Number(longitude)>180)
  return res.status(400).json({error:'Valid household map coordinates are required.'});
 try{
  const info=db.prepare('INSERT INTO users(name,email,password,role,phone) VALUES(?,?,?,?,?)').run(name,email.toLowerCase(),bcrypt.hashSync(password,10),'resident',phone||'');
  db.prepare('INSERT INTO households(user_id,household_name,address,latitude,longitude,photo_url) VALUES(?,?,?,?,?,?)')
   .run(info.lastInsertRowid,householdName.trim(),address.trim(),Number(latitude),Number(longitude),photoUrl||'');
  const user=db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  const token=jwt.sign({id:user.id,role:user.role,name:user.name},SECRET,{expiresIn:'7d'});
  res.status(201).json({token,user:safe(user)});
 }catch(e){res.status(409).json({error:'Email is already registered.'})}
});
app.post('/api/auth/login',(req,res)=>{
 const u=db.prepare('SELECT * FROM users WHERE email=?').get((req.body.email||'').toLowerCase());
 if(!u||!bcrypt.compareSync(req.body.password||'',u.password))return res.status(401).json({error:'Incorrect email or password.'});
 const token=jwt.sign({id:u.id,role:u.role,name:u.name},SECRET,{expiresIn:'7d'});
 res.json({token,user:safe(u)});
});
app.get('/api/me',auth,(req,res)=>res.json(safe(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id))));
app.patch('/api/me',auth,(req,res)=>{
 const {name,phone,available}=req.body;
 db.prepare('UPDATE users SET name=COALESCE(?,name),phone=COALESCE(?,phone),available=COALESCE(?,available) WHERE id=?')
 .run(name??null,phone??null,available===undefined?null:(available?1:0),req.user.id);
 res.json(safe(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)));
});
app.get('/api/drivers',auth,role('admin'),(req,res)=>res.json(db.prepare("SELECT id,name,email,phone,available FROM users WHERE role='driver' ORDER BY name").all().map(u=>({...u,available:!!u.available}))));
app.get('/api/households',auth,(req,res)=>{
 const rows=db.prepare(`SELECT h.*,u.name AS resident_name,u.phone,(SELECT p.status FROM pickups p WHERE p.household_id=h.id ORDER BY p.id DESC LIMIT 1) AS pickup_status FROM households h JOIN users u ON u.id=h.user_id ORDER BY h.id`).all();
 res.json(rows);
});
app.post('/api/households',auth,role('resident'),(req,res)=>{
 const {householdName,address,latitude,longitude,photoUrl}=req.body;
 if(!householdName||!address||!Number.isFinite(Number(latitude))||!Number.isFinite(Number(longitude)))return res.status(400).json({error:'Household name, address and map coordinates are required.'});
 const old=db.prepare('SELECT id FROM households WHERE user_id=?').get(req.user.id);
 if(old) db.prepare('UPDATE households SET household_name=?,address=?,latitude=?,longitude=?,photo_url=? WHERE id=?').run(householdName,address,latitude,longitude,photoUrl||'',old.id);
 else db.prepare('INSERT INTO households(user_id,household_name,address,latitude,longitude,photo_url) VALUES(?,?,?,?,?,?)').run(req.user.id,householdName,address,latitude,longitude,photoUrl||'');
 res.json(db.prepare('SELECT * FROM households WHERE user_id=?').get(req.user.id));
});
app.get('/api/schedules',auth,(req,res)=>res.json(db.prepare('SELECT s.*,u.name AS admin_name FROM schedules s LEFT JOIN users u ON u.id=s.created_by ORDER BY collection_date DESC,id DESC').all()));
app.post('/api/schedules',auth,role('admin'),(req,res)=>{
 const {title,area,collectionDate,startTime,notes}=req.body;
 if(!title||!area||!collectionDate||!startTime)return res.status(400).json({error:'Title, area, date and time are required.'});
 const x=db.prepare('INSERT INTO schedules(title,area,collection_date,start_time,notes,created_by) VALUES(?,?,?,?,?,?)').run(title,area,collectionDate,startTime,notes||'',req.user.id);
 const drivers=db.prepare("SELECT id FROM users WHERE role='driver'").all();
 const residents=db.prepare("SELECT id FROM users WHERE role='resident'").all();
 for(const d of drivers)notify(d.id,'New collection schedule',`${title} — ${area}, ${collectionDate} at ${startTime}`,'schedule');
 for(const r of residents)notify(r.id,'Collection scheduled',`${title} in ${area} on ${collectionDate} at ${startTime}. Prepare your waste.`,'schedule');
 res.status(201).json(db.prepare('SELECT * FROM schedules WHERE id=?').get(x.lastInsertRowid));
});
app.put('/api/schedules/:id',auth,role('admin'),(req,res)=>{
 const {title,area,collectionDate,startTime,notes,status}=req.body;
 const x=db.prepare('UPDATE schedules SET title=?,area=?,collection_date=?,start_time=?,notes=?,status=? WHERE id=?')
 .run(title,area,collectionDate,startTime,notes||'',status||'published',req.params.id);
 if(!x.changes)return res.status(404).json({error:'Schedule not found.'});
 for(const u of db.prepare("SELECT id FROM users WHERE role IN ('driver','resident')").all())notify(u.id,'Schedule updated',`${title} — ${area}, ${collectionDate} at ${startTime}`,'schedule');
 res.json(db.prepare('SELECT * FROM schedules WHERE id=?').get(req.params.id));
});
app.delete('/api/schedules/:id',auth,role('admin'),(req,res)=>{
 db.prepare('DELETE FROM schedules WHERE id=?').run(req.params.id);
 res.json({ok:true});
});
app.post('/api/assignments/:scheduleId/accept',auth,role('driver'),(req,res)=>{
 const sid=Number(req.params.scheduleId);
 db.prepare('INSERT INTO assignments(schedule_id,driver_id,status) VALUES(?,?,?) ON CONFLICT(schedule_id,driver_id) DO UPDATE SET status=excluded.status').run(sid,req.user.id,'accepted');
 notify(db.prepare("SELECT id FROM users WHERE role='admin'").get().id,'Driver accepted schedule',`${req.user.name} accepted a collection assignment.`,'assignment');
 res.json({ok:true,status:'accepted'});
});
app.post('/api/assignments/:scheduleId/start',auth,role('driver'),(req,res)=>{
 db.prepare("UPDATE assignments SET status='in_progress',started_at=CURRENT_TIMESTAMP WHERE schedule_id=? AND driver_id=?").run(req.params.scheduleId,req.user.id);
 res.json({ok:true,status:'in_progress'});
});
app.get('/api/assignments',auth,role('admin','driver'),(req,res)=>{
 const q=`SELECT a.*,s.title,s.area,s.collection_date,s.start_time,u.name AS driver_name FROM assignments a JOIN schedules s ON s.id=a.schedule_id JOIN users u ON u.id=a.driver_id ${req.user.role==='driver'?'WHERE a.driver_id=?':''} ORDER BY a.id DESC`;
 res.json(req.user.role==='driver'?db.prepare(q).all(req.user.id):db.prepare(q).all());
});
app.post('/api/pickups',(req,res,next)=>auth(req,res,()=>role('driver')(req,res,next)),(req,res)=>{
 const {scheduleId,householdId,status,note}=req.body;
 if(!['picked_up','not_picked_up'].includes(status))return res.status(400).json({error:'Invalid pickup status.'});
 db.prepare(`INSERT INTO pickups(schedule_id,household_id,driver_id,status,note) VALUES(?,?,?,?,?)
 ON CONFLICT(schedule_id,household_id) DO UPDATE SET driver_id=excluded.driver_id,status=excluded.status,note=excluded.note,updated_at=CURRENT_TIMESTAMP`)
 .run(scheduleId,householdId,req.user.id,status,note||'');
 const h=db.prepare('SELECT user_id,household_name FROM households WHERE id=?').get(householdId);
 if(h)notify(h.user_id,status==='picked_up'?'Waste picked up':'Waste not picked up',status==='picked_up'?`Your household (${h.household_name}) has been collected.`:`Your household (${h.household_name}) was not collected. Please check the next schedule or contact the municipality.`,status==='picked_up'?'success':'warning');
 res.json({ok:true,status});
});
app.get('/api/pickups',auth,(req,res)=>{
 const q=`SELECT p.*,h.household_name,h.address,h.latitude,h.longitude,h.photo_url,u.name AS resident_name
 FROM pickups p JOIN households h ON h.id=p.household_id JOIN users u ON u.id=h.user_id
 ${req.user.role==='resident'?'WHERE h.user_id=?':req.user.role==='driver'?'WHERE p.driver_id=?':''} ORDER BY p.updated_at DESC`;
 res.json(req.user.role==='resident'?db.prepare(q).all(req.user.id):req.user.role==='driver'?db.prepare(q).all(req.user.id):db.prepare(q).all());
});
app.get('/api/notifications',auth,(req,res)=>res.json(db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100').all(req.user.id)));
app.patch('/api/notifications/:id/read',auth,(req,res)=>{db.prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').run(req.params.id,req.user.id);res.json({ok:true})});
app.get('/api/messages/:userId',auth,role('admin','driver'),(req,res)=>{
 const other=Number(req.params.userId);
 const peer=db.prepare('SELECT id,role FROM users WHERE id=?').get(other);
 if(!peer||!((req.user.role==='admin'&&peer.role==='driver')||(req.user.role==='driver'&&peer.role==='admin')))return res.status(403).json({error:'Chat is limited to municipal admin and official drivers.'});
 res.json(db.prepare('SELECT m.*,s.name AS sender_name FROM messages m JOIN users s ON s.id=m.sender_id WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY m.id').all(req.user.id,other,other,req.user.id));
});