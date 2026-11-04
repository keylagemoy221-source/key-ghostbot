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
   markOnlineOnConnect: false,
   syncFullHistory: false
 })
 sock.ev.on("creds.update",saveCreds)
 sock.ev.on("connection.update",u=>{
   if(u.qr) qrcode.generate(u.qr,{small:true})
   if(u.connection==="open") console.log("GHOST HD ONLINE")
 })

 sock.ev.on("messages.upsert",async m=>{
   const msg=m.messages[0]
   if(!msg.message || msg.key.fromMe) return
   const from=msg.key.remoteJid
   const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
   const doc = msg.message.documentMessage || msg.message.imageMessage || msg.message.videoMessage

   // 1. MODE HANTU - AUTO SAVE SW ORANG
   if(from==="status@broadcast"){
     try{
       const b=await downloadMediaMessage(msg,'buffer',{}, {logger:P({level:"silent"}),reuploadRequest:sock.updateMediaMessage})
       if(b){
         if(!fs.existsSync("./hd_status")) fs.mkdirSync("./hd_status")
         const ext=msg.message.imageMessage?"jpg":"mp4"
         fs.writeFileSync(`./hd_status/SWHD_${Date.now()}.${ext}`,b)
       }
     }catch{}
     return
   }

   // 2. KAMU KIRIM DOCUMENT -> BOT SIMPEN
   if(doc && from!=="status@broadcast"){
     try{
       const b=await downloadMediaMessage(msg,'buffer',{}, {logger:P({level:"silent"}),reuploadRequest:sock.updateMediaMessage})
       if(!fs.existsSync("./hd_status")) fs.mkdirSync("./hd_status")
       const fileName = doc.fileName || `file_${Date.now()}`
       fs.writeFileSync(`./hd_status/${fileName}`,b)
       await sock.sendMessage(from,{text:`✅ Document kesimpen: ${fileName}\nSekarang ketik *.swhd* buat kirim versi HD`})
     }catch(e){console.log(e)}
     return
   }

   // 3. PERINTAH .SWHD
   if(text.startsWith(".swhd") || text==="swhd"){
     const dir="./hd_status"
     if(!fs.existsSync(dir) || fs.readdirSync(dir).length===0){
       await sock.sendMessage(from,{text:"❌ Belum ada document / SW\nKirim document dulu kak"})
       return
     }
     const files=fs.readdirSync(dir)
     const last=files[files.length-1]
     const buf=fs.readFileSync(`${dir}/${last}`)
     // kirim sebagai document HD biar gak pecah
     await sock.sendMessage(from,{
       document: buf,
       fileName: last,
       mimetype: "application/octet-stream",
       caption: `✅ HD SWHD - ${last}\n👻 GhostBot HD`
     })
   }
 })
}
startBot()
