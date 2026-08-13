const express=require("express"),path=require("path");
const app=express(),PORT=process.env.PORT||3000;
app.use(express.json({limit:"15mb"}));app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/firebase-config",(req,res)=>res.json({
 apiKey:"AIzaSyDa70W8hnwSt9Hzo9TeuvPnlT9T7VLgKJ4",
 databaseURL:"https://xxx-videos-2582e-default-rtdb.europe-west1.firebasedatabase.app",
 projectId:"xxx-videos-2582e",
 storageBucket:"xxx-videos-2582e.firebasestorage.app",
 appId:"1:168809684553:android:5006b58b92dfb7e497e998"
}));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin","index.html")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("Fetcher: http://localhost:"+PORT));
