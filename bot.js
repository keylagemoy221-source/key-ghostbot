
const {default:makeWASocket,useMultiFileAuthState,downloadMediaMessage} = require("@whiskeysockets/baileys")
const P = require("pino")
const fs = require("fs")
const qrcode = require("qrcode-terminal")

async function startBot(){
 const {state,saveCreds} = await useMultiFileAuthState("auth")
 const sock = makeWASocket({
   auth: state,
   logger: P({level:"silent"}),
   browser: ["GhostBot HD","Chrome","20.0"],
   markOnlineOnConnect: false
 })
 sock.ev.on("creds.update",saveCreds)
 sock.ev.on("connection.update",u=>{
   if(u.qr) qrcode.generate(u.qr,{small:true})
   if(u.connection==="open") console.log("Ghost HD Online")
 })
 sock.ev.on("messages.upsert",async m=>{
   const msg=m.messages[0]
   if(!msg.message) return
   const from=msg.key.remoteJid
   if(from==="status@broadcast"){
     try{
       const b=await downloadMediaMessage(msg,'buffer',{}, {logger:P({level:"silent"}),reuploadRequest:sock.updateMediaMessage})
       if(b){
         if(!fs.existsSync("./hd_status")) fs.mkdirSync("./hd_status")
         const ext=msg.message.imageMessage?"jpg":"mp4"
         fs.writeFileSync(`./hd_status/GHOST_${Date.now()}.${ext}`,b)
       }
     }catch{}
     return
   }
 })
}
startBot()
