const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://kamal:123456789kamal0@cluster0.aalzquo.mongodb.net/passkey?appName=Cluster0")
    .then(() => console.log("Successfully Connected to DB"))
    .catch((err) => {
        console.log("MongoDB Connection Error:");
        console.error(err.message);
    });

// Defined Schema so fields are readable
const credentialSchema = new mongoose.Schema({
    user: String,
    pass: String
});
const credential = mongoose.model("credential", credentialSchema, "bulkmail");

app.post("/sendmail", async function (req, res) {
    const msg = req.body.msg;
    const emailList = req.body.emailList;

    try {
        // 1. Get credentials from DB
        const data = await credential.find();
        
        if (data.length === 0) {
            console.log("No credentials found in database 'bulkmail' collection.");
            return res.status(500).send("Database credentials missing");
        }

        const authUser = data[0].user;
        const authPass = data[0].pass;

        // 2. Set up Transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: authUser,
                pass: authPass,
            },
        });

        // 3. Send emails
        for (let i = 0; i < emailList.length; i++) {
            await transporter.sendMail({
                from: authUser, 
                to: emailList[i],
                subject: "A message from Bulk Mail App",
                text: msg,
            });
            console.log("Email sent to: " + emailList[i]);
        }

        res.send(true);

    } catch (error) {
        console.error("Error in /sendmail route:", error);
        res.send(false);
    }
});

app.listen(5000, () => {
    console.log("Backend server started on port 5000...");
});