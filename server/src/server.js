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