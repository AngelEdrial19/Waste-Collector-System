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