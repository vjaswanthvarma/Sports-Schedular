const express=require("express");
const bodyParser=require("body-parser");
const dirname=require("path");
const fileURLToPathfrom=require("url");
const { connected } = require("process");
const app=express();
var md5 = require('md5');
const session=require("express-session");
const passport=require("passport");
const Swal = require('sweetalert2')
const {Client}=require("pg");
const Strategy=require("passport-local");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
    secret:"TOPSECRET",
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:1000*60*60*24,
    }
}))
app.use(passport.initialize());
app.use(passport.session());
const db=new Client({
    host:"localhost",
    user:"postgres",
    port:5432,
    password:"jaswanth",
    database:"firstdb",
})
var upedit="";
var users="";
var items=[];
db.connect();
app.get("/admin",async(req,res)=>{
    items=[];
    const print= await db.query("Select * from sessions");
    print.rows.forEach((docs)=>{
        items.push({img:docs.img,name:docs.sname,venue:docs.venue,start:docs.date})
    })
    res.render("Admindashboard.ejs",{
        names:items,
    });
})
app.get("/adminlogin",(req,res)=>{
    res.render("adminlogin.ejs");
})
app.post("/adminsubmits",async(req,res)=>{
    console.log(req.body.name);
    const print= await db.query("Select * from users where name=$1 and password=$2 and role=$3",[req.body.username,md5(req.body.password),req.body.role]);
    if(print.rows.length>0){
        res.redirect("/admin")
    }
    else{
        res.render("adminlogin.ejs");
    }
})
app.get("/login",(req,res)=>{
    if(req.isAuthenticated()){
        res.redirect("/player")
    }
    else{
       res.render("userlogin.ejs");
    }
})
app.post("/loginsubmits",passport.authenticate("local",{
    successRedirect:"/login",
    failureRedirect:"/login",
}));

app.post("/signsubmit",async(req,res)=>{
    users=req.body.name;
    await db.query("Insert Into users(name,password,email,address,pincode,role) Values($1,$2,$3,$4,$5,$6)",[req.body.name,md5(req.body.password),req.body.email,req.body.address,req.body.pincode,req.body.role])
    if(req.body.role=='student'){
    res.redirect("/player");}
    else{
        res.redirect("/admin");
    }
})
app.get("/signup",(req,res)=>{
    res.render("signup.ejs");
})
app.get("/logout",(req,res)=>{
    res.redirect("/");
})
app.get("/",(req,res)=>{
    res.render("start.ejs");
})
app.get("/getsessions",async(req,res)=>{
    var getsessions=[];
    const print= await db.query("Select * from joinsessions where pname=$1",[users]);
    print.rows.forEach((docs)=>{
        getsessions.push({img:docs.img,pname:docs.pname,name:docs.sname,venue:docs.venue,start:docs.date})
    })
    res.render("getSessions.ejs",{
        names:getsessions,
    })
})
app.post("/addsession",async(req,res)=>{
    const abc= await db.query("Insert Into sessions(img,sname,venue,date) Values($1,$2,$3,$4)",[req.body.bimg,req.body.name,req.body.venue,req.body.start]);
    res.redirect("/admin");
})
app.post("/delete",async(req,res)=>{
    await db.query("Delete from sessions where sname=$1",[req.body.name]);
    res.redirect("/admin");
})
app.post("/edit",(req,res)=>{
    upedit=req.body.name;
    res.sendFile(__dirname+"/form.html");
})
app.post("/joinsession",async(req,res)=>{
    const abc= await db.query("Insert Into joinsessions(img,pname,sname,venue,date) Values($1,$2,$3,$4,$5)",[req.body.img,req.body.fname,req.body.name,req.body.venue,req.body.start]);
    res.redirect("/getsessions");
})
app.post("/editupdate",async(req,res)=>{
    await db.query("Delete from sessions where sname=$1",[upedit]);
    const abc= await db.query("Insert Into sessions(img,sname,venue,date) Values($1,$2,$3,$4)",[req.body.dimg,req.body.name,req.body.venue,req.body.start]);
    upedit="";
    res.redirect("/admin");
})
app.get("/player",async(req,res)=>{
    items=[];
    const print= await db.query("Select * from sessions");
    print.rows.forEach((docs)=>{
        items.push({img:docs.img,name:docs.sname,venue:docs.venue,start:docs.date})
    })
    res.render("playerdashboard.ejs",{
        names:items,
    });
})
passport.use(new Strategy(async function verify(username,password,cb){
    users=username;
    const print= await db.query("Select * from users where name=$1 and password=$2",[username,md5(password)]);
    const user=print.rows[0];
    if(print.rows.length>0){
        if(print){
       return cb(null,user);}
       else{
        return cb(err);
       }
    }
    else{
        return cb(null,false);}
}))
passport.serializeUser((user,cb)=>{
    cb(null,user);
})
passport.deserializeUser((user,cb)=>{
    cb(null,user);
})
app.listen(4000,(req,res)=>{
    console.log("app is started");
})
db.end;
