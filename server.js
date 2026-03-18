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

const DATA_FOLDER = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_FOLDER, "messages.json");
/* 🔐 PROTECT ADMIN PAGE */

app.get("/admin.html", adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/* CREATE DATA FOLDER IF NOT EXISTS */

if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER);
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
}

/* MAIL TRANSPORTER */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});


/* ADMIN API TO VIEW MESSAGES */

function adminAuth(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Admin Panel"');
        return res.status(401).send("Authentication required.");
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");

    const [username, password] = credentials.split(":");

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



/* ADMIN API TO VIEW MESSAGES */
app.get("/admin/messages", adminAuth, (req, res) => {

    try {

        const messages = JSON.parse(fs.readFileSync(DATA_FILE));
        res.json(messages);

    } catch {

        res.json([]);

    }

});

/* CONTACT FORM */

app.post("/send-message", async (req, res) => {

    const { name, email, topic, message } = req.body;

    const ticketID = generateTicketID();
    const time = new Date().toLocaleString();

    /* SAVE MESSAGE LOCALLY */

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

        console.log("Error saving message:", err);

    }

    try {

        /* ADMIN EMAIL */

        const adminMail = {
            from: process.env.EMAIL,
            to: process.env.EMAIL,
            subject: `🚨 New Contact Message | Ticket ${ticketID}`,

            html: `
<div style="margin:0;padding:0;background:#0a0f1c;font-family:Arial,Helvetica,sans-serif;color:#ffffff">

<div style="max-width:650px;margin:40px auto;background:#111827;border-radius:14px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 0 40px rgba(0,255,255,0.05)">

<!-- HEADER -->
<div style="background:linear-gradient(135deg,#00eaff,#0066ff);padding:25px;text-align:center">
<h1 style="margin:0;font-size:24px;color:#0a0f1c;font-weight:bold">
NovaShyld Technologies
</h1>
<p style="margin:5px 0 0 0;font-size:14px;color:#0a0f1c">
New Contact Form Submission
</p>
</div>

<!-- CONTENT -->
<div style="padding:30px">

<div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:20px;margin-bottom:25px">

<p style="margin:0 0 10px 0;font-size:13px;color:#94a3b8">Ticket ID</p>
<h2 style="margin:0;color:#00eaff">${ticketID}</h2>

</div>

<table style="width:100%;border-collapse:collapse;font-size:14px">

<tr>
<td style="padding:10px;color:#94a3b8;width:30%">Name</td>
<td style="padding:10px;color:#ffffff">${name}</td>
</tr>

<tr>
<td style="padding:10px;color:#94a3b8">Email</td>
<td style="padding:10px;color:#ffffff">${email}</td>
</tr>

<tr>
<td style="padding:10px;color:#94a3b8">Topic</td>
<td style="padding:10px;color:#ffffff">${topic}</td>
</tr>

<tr>
<td style="padding:10px;color:#94a3b8">Time</td>
<td style="padding:10px;color:#ffffff">${time}</td>
</tr>

</table>

<div style="margin-top:30px">
<p style="color:#94a3b8;margin-bottom:10px">Message</p>

<div style="background:#0b1220;padding:20px;border-radius:10px;border:1px solid #1e293b;line-height:1.7;font-size:14px">
${message}
</div>

</div>

</div>

<!-- FOOTER -->
<div style="background:#0f172a;text-align:center;padding:20px;font-size:12px;color:#64748b">
Internal Admin Notification • NovaShyld Technologies
</div>

</div>
</div>
`
        };

        await transporter.sendMail(adminMail);

        /* USER AUTO REPLY */

        const userMail = {
            from: process.env.EMAIL,
            to: email,
            subject: `NovaShyld Technologies | Ticket ${ticketID}`,

            html: `
<div style="margin:0;padding:0;background:#0a0f1c;font-family:Arial,Helvetica,sans-serif;color:#ffffff">

<div style="max-width:650px;margin:40px auto;background:#111827;border-radius:14px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 0 40px rgba(0,255,255,0.05)">

<!-- HEADER -->
<div style="background:linear-gradient(135deg,#00eaff,#0066ff);padding:30px;text-align:center">
<h1 style="margin:0;font-size:24px;color:#0a0f1c;font-weight:bold">
NovaShyld Technologies
</h1>
<p style="margin:5px 0 0 0;font-size:14px;color:#0a0f1c">
Learn • Build • Secure
</p>
</div>

<!-- CONTENT -->
<div style="padding:35px">

<p style="font-size:15px;margin-bottom:15px">
Hello <strong>${name}</strong>,
</p>

<p style="font-size:14px;color:#cbd5e1;line-height:1.7">
Thank you for contacting NovaShyld Technologies.
Your message has been successfully received and our team will review it shortly.
</p>

<!-- TICKET BOX -->
<div style="margin:30px 0;padding:20px;border-radius:12px;background:#0f172a;border:1px solid #1e293b;text-align:center">

<p style="margin:0;font-size:13px;color:#94a3b8">Your Ticket ID</p>
<h2 style="margin:8px 0 15px 0;color:#00eaff">${ticketID}</h2>

<p style="margin:0;font-size:13px;color:#94a3b8">Topic</p>
<p style="margin:5px 0 0 0;font-size:14px">${topic}</p>

</div>

<p style="font-size:14px;color:#cbd5e1">
If you have additional information, simply reply to this email.
</p>

<!-- BUTTON -->
<div style="text-align:center;margin-top:30px">
<a href="mailto:${process.env.EMAIL}" 
style="background:linear-gradient(135deg,#00eaff,#0066ff);
color:#0a0f1c;
padding:12px 25px;
border-radius:30px;
text-decoration:none;
font-weight:bold;
display:inline-block">
Contact Support
</a>
</div>

</div>

<!-- FOOTER -->
<div style="background:#0f172a;text-align:center;padding:20px;font-size:12px;color:#64748b">
© 2026 NovaShyld Technologies • All rights reserved
</div>

</div>
</div>
`
        };

        await transporter.sendMail(userMail);

       res.json({ message: "Message sent successfully", ticketId: ticketID });
    } catch (error) {

        console.log("Email error:", error);

        res.json({ message: "Failed to send message" });

    }

});

app.post("/ai-chat", (req, res) => {

    const userMessage = req.body.message.toLowerCase().trim();

    let reply = "I'm NovaShyld AI Assistant 🤖. Ask me about cybersecurity, services, internships, or security topics.";

    /* GREETING */

    if (userMessage === "hi" || userMessage === "hello" || userMessage === "hey") {
        reply = "Hello 👋 Welcome to NovaShyld Technologies. How can I assist you today?";
    }

    /* INTERNSHIP */

    else if (userMessage.includes("internship")) {
        reply = "To apply for the NovaShyld Cybersecurity Internship, please go to the Internship page and submit the form. Before applying, contact us through the Contact page to receive your token number.";
    }

    /* SERVICES */

    else if (userMessage.includes("service") || userMessage.includes("services")) {
        reply = "NovaShyld Technologies provides:\n\n• Web Application Security Testing\n• Vulnerability Assessment & Penetration Testing (VAPT)\n• Ethical Hacking\n• Cybersecurity Training\n\nLet me know which service you need.";
    }

    /* PENETRATION TESTING */

    else if (userMessage.includes("penetration testing") || userMessage.includes("pentest")) {
        reply = "Penetration Testing is a simulated cyber attack used to find vulnerabilities in systems before real attackers exploit them.";
    }

    /* SQL INJECTION */

    else if (userMessage.includes("sql injection")) {
        reply = "SQL Injection is a web vulnerability where attackers inject malicious SQL queries to access or manipulate database data.";
    }

    /* XSS */

    else if (userMessage.includes("xss")) {
        reply = "Cross-Site Scripting (XSS) allows attackers to inject malicious JavaScript into websites viewed by other users.";
    }

    /* CONTACT */

    else if (userMessage.includes("contact")) {
        reply = "You can contact NovaShyld Technologies through the Contact page on our website. Our team will respond with a ticket ID.";
    }

    /* THANK YOU */

    else if (userMessage.includes("thank")) {
        reply = "You're welcome 😊 If you need help with cybersecurity, services, or internships, feel free to ask.";
    }

    res.json({ reply: reply });

});
/* INTERN LOGIN CHECK */

app.post("/intern-login", (req, res) => {

    const { email, token } = req.body;

    try {

        const messages = JSON.parse(fs.readFileSync(DATA_FILE));

        const user = messages.find(
            m => m.email === email && m.ticketID === token
        );

        if (user) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false });
    }

});

/* START SERVER */

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});



/* GENERATE TICKET */

function generateTicketID() {
    return "NS-" + Math.floor(100000 + Math.random() * 900000);
}
