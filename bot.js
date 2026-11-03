const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")
async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, logger: P({level: 'silent'}) })
  sock.ev.on('connection.update', (u)=>{ if(u.connection==='open') console.log("✅ GHOSTBOT INDO ONLINE!") })
  sock.ev.on('messages.upsert', async (m)=>{
    const msg = m.messages[0]
    if(!msg.message || msg.key.fromMe) return
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").toLowerCase()
    const from = msg.key.remoteJid
    if(text==="halo"||text==="hai"||text==="hi") await sock.sendMessage(from,{text:"👻 Halo kak! Aku GhostBot Indo! Ketik *menu* ya"})
    else if(text==="menu") await sock.sendMessage(from,{text:"📋 MENU\n• halo - sapa bot\n• post sw - posting SW HD\n• ghost - mode hantu"})
    else if(text.includes("post sw")){ await sock.sendMessage('status@broadcast',{image:{url:"https://picsum.photos/1080/1920"},caption:"Via GhostBot HD 🔥"}); await sock.sendMessage(from,{text:"✅ SW HD diposting!"}) }
  })
  sock.ev.on('creds.update', saveCreds)
}
startBot()
