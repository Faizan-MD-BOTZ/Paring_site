import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import P from "pino";

// 🔰 Bot start function
async function connectBot() {
  // Session save hone ke liye
  const { state, saveCreds } = await useMultiFileAuthState("session");

  // Socket create karte hain
  const sock = makeWASocket({
    printQRInTerminal: true, // QR code terminal me show karega
    auth: state,
    logger: P({ level: "silent" })
  });

  // Jab bhi session update ho
  sock.ev.on("creds.update", saveCreds);

  // Connection status check
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Connection closed. Reconnect:", shouldReconnect);
      if (shouldReconnect) connectBot();
    } else if (connection === "open") {
      console.log("✅ WhatsApp Bot connected successfully!");
    }
  });

  // Jab koi message aaye
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const text = m.message.conversation || m.message.extendedTextMessage?.text;
    if (!text) return;

    console.log("📩 Message:", text);

    // Simple auto replies
    if (text.toLowerCase() === "hi") {
      await sock.sendMessage(m.key.remoteJid, { text: "👋 Hello! I am your WhatsApp bot." });
    } else if (text.toLowerCase() === "ping") {
      await sock.sendMessage(m.key.remoteJid, { text: "🏓 Pong!" });
    } else if (text.toLowerCase() === "bot") {
      await sock.sendMessage(m.key.remoteJid, { text: "🤖 Bot is active and running fine!" });
    }
  });
}

// Bot start
connectBot();
