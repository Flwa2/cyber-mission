// Public static entry point only. Does not open or write the mission store.
import express from 'express';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
const app=express(),port=Number(process.env.EVENT_PORT||5177);
const api=new URL(process.env.EVENT_API_TARGET||'http://127.0.0.1:4000');
const dist=fileURLToPath(new URL('../../frontend/dist/',import.meta.url));
app.disable('x-powered-by');
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','same-origin');next();});
app.use('/api',(req,res)=>{
 const path=req.originalUrl.split('?')[0];
 const allowed=req.method==='GET'&&['/api/health','/api/booth/leaderboard'].includes(path)||req.method==='POST'&&(/^\/api\/booth\/independent\/CM-[A-Z0-9]{6}\/[1-4]\/(sync|poll|activate|desk|investigation|resolution)$/.test(path)||/^\/api\/booth\/stations\/[1-4]\/(sync|poll|activate|heartbeat|release|desk|investigation|resolution)$/.test(path));
 if(!allowed)return res.status(404).json({error:'Not found'});
 res.set('Cache-Control','no-store');
 const headers={'content-type':req.headers['content-type']||'application/json'};
 if(req.headers['content-length'])headers['content-length']=req.headers['content-length'];
 const upstream=http.request(new URL(req.originalUrl,api),{method:req.method,headers,timeout:15000},reply=>{res.status(reply.statusCode);if(reply.headers['content-type'])res.set('Content-Type',reply.headers['content-type']);reply.pipe(res);});
 upstream.on('timeout',()=>upstream.destroy());
 upstream.on('error',()=>{if(!res.headersSent)res.status(503).json({error:'Connection unavailable. Please retry.'});else res.end();});
 req.on('aborted',()=>upstream.destroy());req.pipe(upstream);
});
app.use(express.static(dist,{index:false,dotfiles:'deny',maxAge:0}));
app.get(['/', '/live-leaderboard'],(req,res)=>res.set('Cache-Control','no-store').sendFile(dist+'index.html'));
app.listen(port,'127.0.0.1',()=>console.log(`Event frontend and API: http://127.0.0.1:${port}`));
