require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

/* =========================
   📁 FILE PATHS
========================= */

const DATA_FOLDER = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_FOLDER, "messages.json");
const CERT_FILE = path.join(DATA_FOLDER, "certificates.json");

/* =========================
   📁 CREATE FILES
========================= */

if (!fs.existsSync(DATA_FOLDER)) fs.mkdirSync(DATA_FOLDER);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");
if (!fs.existsSync(CERT_FILE)) fs.writeFileSync(CERT_FILE, "[]");

/* =========================
   🔐 ADMIN AUTH
========================= */

function adminAuth(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Admin Panel"');
        return res.status(401).send("Authentication required.");
    }

    const base64 = authHeader.split(" ")[1];
    const [username, password] = Buffer.from(base64, "base64").toString().split(":");

    if (
        username === process.env.ADMIN_USER &&
        password === process.env.ADMIN_PASS
    ) {
        next();
    } else {
        res.setHeader("WWW-Authenticate", 'Basic realm="Admin Panel"');
        return res.status(401).send("Invalid credentials.");
    }
}

/* =========================
   🔐 PROTECT ADMIN PAGE
========================= */

app.get("/admin.html", adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* =========================
   📩 LOAD MESSAGES
========================= */

app.get("/admin/messages", adminAuth, (req, res) => {
    try {
        const messages = JSON.parse(fs.readFileSync(DATA_FILE));
        res.json(messages);
    } catch {
        res.json([]);
    }
});

/* =========================
   🎓 ADD CERTIFICATE
========================= */

app.post("/add-certificate", adminAuth, async (req, res) => {

    try {
        const { name, ticket, domain } = req.body;

        let certs = [];

try {
    certs = JSON.parse(fs.readFileSync(CERT_FILE));
} catch {
    certs = [];
}

        certs.push({
            name,
            ticket,
            domain,
            date: new Date().toLocaleDateString()
        });

        fs.writeFileSync(CERT_FILE, JSON.stringify(certs, null, 2));

        res.json({ success: true });

    } catch (err) {
        console.log("CERT ADD ERROR:", err);
        res.status(500).json({ success: false });
    }
});

/* =========================
   🔍 VERIFY CERTIFICATE
========================= */

app.get("/verify-certificate/:ticket", async (req, res) => {

    try {
        const ticket = req.params.ticket;

        const certs = JSON.parse(fs.readFileSync(CERT_FILE));

        const cert = certs.find(c => c.ticket === ticket);

        if (cert) {
            res.json({
                valid: true,
                name: cert.name,
                ticket: cert.ticket,
                domain: cert.domain,
                date: cert.date
            });
        } else {
            res.json({ valid: false });
        }

    } catch (err) {
        console.log("VERIFY ERROR:", err);
        res.status(500).json({ valid: false });
    }
});

/* =========================
   📬 CONTACT FORM
========================= */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

app.post("/send-message", async (req, res) => {

    const { name, email, topic, message } = req.body;

    const ticketID = generateTicketID();
    const time = new Date().toLocaleString();

    try {
        let messages = JSON.parse(fs.readFileSync(DATA_FILE));

        messages.push({
            ticketID,
            name,
            email,
            topic,
            message,
            time
        });

        fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));

    } catch (err) {
        console.log("SAVE ERROR:", err);
    }

    try {

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: process.env.EMAIL,
            subject: `New Message ${ticketID}`,
            text: message
        });

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: `Your Ticket ${ticketID}`,
            text: `Your ticket ID is ${ticketID}`
        });

        res.json({ message: "Message sent", ticketId: ticketID });

    } catch (error) {
        console.log("MAIL ERROR:", error);
        res.status(500).json({ message: "Mail failed" });
    }

});

/* =========================
   🔑 INTERN LOGIN
========================= */

app.post("/intern-login", (req, res) => {

    const { email, token } = req.body;

    try {
        const messages = JSON.parse(fs.readFileSync(DATA_FILE));

        const user = messages.find(
            m => m.email === email && m.ticketID === token
        );

        res.json({ success: !!user });

    } catch {
        res.json({ success: false });
    }
});

/* =========================
   🚀 START SERVER
========================= */

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

/* =========================
   🎟 GENERATE TICKET
========================= */

function generateTicketID() {
    return "NS-" + Math.floor(100000 + Math.random() * 900000);
}
app.get("/admin-auth-check", adminAuth, (req, res) => {
    res.json({ success: true });
});