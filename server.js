// server.js
// This is the API. It has three routes: send, resend, and verify.
// Each route just calls a function from otpStore.js and sends back the result.

const express = require("express");
const path = require("path");
const otpStore = require("./otpStore");

const app = express();
const PORT = 3000;

// Let the app read JSON from the request body.
app.use(express.json());

// Serve the frontend HTML pages from the "public" folder.
app.use(express.static(path.join(__dirname, "public")));

// POST /send
// Body: { "email": "someone@example.com" }
// Creates a new OTP for the email and "sends" it (we log it to the console).
app.post("/send", function (req, res) {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const result = otpStore.sendOtp(email);
  if (!result.ok) {
    return res.status(429).json({ message: result.message });
  }

  // In a real system we would email this. For the test we log it.
  console.log("OTP for " + email + " is: " + result.otp);

  res.json({ message: "OTP sent. Check the server console." });
});

// POST /resend
// Body: { "email": "someone@example.com" }
// Resends the same OTP if inside the resend window, else makes a new one.
app.post("/resend", function (req, res) {
  const email = req.body.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  const result = otpStore.resendOtp(email);
  if (!result.ok) {
    return res.status(429).json({ message: result.message });
  }

  console.log("Resent OTP for " + email + " is: " + result.otp);

  res.json({ message: "OTP resent. Check the server console." });
});

// POST /verify
// Body: { "email": "someone@example.com", "otp": "004321" }
// Checks whether the OTP is valid for that email.
app.post("/verify", function (req, res) {
  const email = req.body.email;
  const otp = req.body.otp;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  const result = otpStore.verifyOtp(email, otp);
  if (result.valid) {
    res.json({ valid: true, message: "OTP is valid." });
  } else {
    res.json({ valid: false, message: result.message });
  }
});

app.listen(PORT, function () {
  console.log("OTP server running on http://localhost:" + PORT);
});