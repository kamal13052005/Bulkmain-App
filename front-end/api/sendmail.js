"use strict";
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI not defined");
  
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;
}

const credentialSchema = new mongoose.Schema({
  user: String,
  pass: String,
});

const credential = mongoose.models.credential ||
  mongoose.model("credential", credentialSchema, "bulkmail");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    await connectDB();

    const { msg, emailList } = req.body;

    if (!emailList || emailList.length === 0)
      return res.status(400).json({ success: false, error: "No emails provided" });

    const data = await credential.find().lean();
    
    if (data.length === 0)
      return res.status(500).json({ success: false, error: "No credentials in DB" });

    const authUser = data[0].user;
    const authPass = data[0].pass;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: authUser, pass: authPass },
    });

    for (let i = 0; i < emailList.length; i++) {
      await transporter.sendMail({
        from: authUser,
        to: emailList[i],
        subject: "A message from Bulk Mail App",
        text: msg,
      });
      console.log("Email sent to: " + emailList[i]);
    }

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("SENDMAIL ERROR:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};