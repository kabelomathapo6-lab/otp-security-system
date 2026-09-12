// otpStore.js
// This file stores the OTPs in memory and holds all the OTP rules.
// "In memory" means everything is kept in a normal variable, so it
// resets when the server restarts. That is fine for this test.

const config = require("./config");

// We keep one record per email address.
// otpData[email] = {
//   otp: "004321",        the current OTP (6 digits, can start with 0)
//   createdAt: <time>,    when this OTP was made
//   expiresAt: <time>,    when this OTP expires
//   resendCount: 0,       how many times it has been resent
//   used: false           whether it has already been verified once
// }
const otpData = {};

// We also keep a short history of OTPs sent to each email in the last 24
// hours, so we can avoid sending the same number twice within 24 hours.
// history[email] = [ { otp: "004321", time: <time> }, ... ]
const history = {};

// We keep the times of recent requests per email, to limit requests per hour.
// requests[email] = [ <time>, <time>, ... ]
const requests = {};

// Make a random 6-digit OTP as a string. It can start with 0.
function makeSixDigits() {
  const number = Math.floor(Math.random() * 1000000); // 0 to 999999
  return String(number).padStart(config.otpLength, "0"); // pad with zeros
}

// Make an OTP that was NOT already used for this email in the last 24 hours.
function makeUniqueOtp(email) {
  const now = Date.now();
  const cutoff = now - config.noRepeatHours * 60 * 60 * 1000;

  // Keep only history entries from the last 24 hours.
  const recent = (history[email] || []).filter(function (item) {
    return item.time >= cutoff;
  });
  history[email] = recent;

  // Try until we get one that is not in the recent list.
  let otp = makeSixDigits();
  const recentNumbers = recent.map(function (item) {
    return item.otp;
  });
  while (recentNumbers.includes(otp)) {
    otp = makeSixDigits();
  }
  return otp;
}

// Check if the email has hit the "max requests per hour" limit.
// Returns true if they are allowed to request another one.
function underHourlyLimit(email) {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000; // one hour ago

  // Keep only requests from the last hour.
  const recent = (requests[email] || []).filter(function (time) {
    return time >= cutoff;
  });
  requests[email] = recent;

  return recent.length < config.maxRequestsPerHour;
}

// Record that the email just made a request (for the hourly limit).
function recordRequest(email) {
  if (!requests[email]) {
    requests[email] = [];
  }
  requests[email].push(Date.now());
}

// Send a new OTP for this email (this is the "Send OTP" action).
// Returns { ok: true, otp } or { ok: false, message }.
function sendOtp(email) {
  if (!underHourlyLimit(email)) {
    return { ok: false, message: "Too many OTP requests. Please try again later." };
  }

  const otp = makeUniqueOtp(email);
  const now = Date.now();

  // Save it as the current OTP for this email. A new OTP replaces the old,
  // so only the latest OTP is valid.
  otpData[email] = {
    otp: otp,
    createdAt: now,
    expiresAt: now + config.expirySeconds * 1000,
    resendCount: 0,
    used: false
  };

  // Add to history and record the request.
  if (!history[email]) {
    history[email] = [];
  }
  history[email].push({ otp: otp, time: now });
  recordRequest(email);

  return { ok: true, otp: otp };
}

// Resend an OTP for this email (this is the "Resend OTP" action).
// If the current OTP is still within the resend window, resend the SAME one
// and just update the expiry. Otherwise make a new one.
function resendOtp(email) {
  const current = otpData[email];

  // If there is no OTP yet, resending just works like sending a new one.
  if (!current) {
    return sendOtp(email);
  }

  const now = Date.now();
  const resendWindowEnd = current.createdAt + config.resendWindowMinutes * 60 * 1000;

  // Inside the resend window: resend the same OTP.
  if (now <= resendWindowEnd) {
    if (current.resendCount >= config.maxResends) {
      return { ok: false, message: "This OTP has been resent too many times." };
    }
    current.resendCount = current.resendCount + 1;
    current.expiresAt = now + config.expirySeconds * 1000; // update the expiry
    current.used = false; // it can be used again since expiry was refreshed
    return { ok: true, otp: current.otp };
  }

  // Outside the resend window: make a new OTP instead.
  return sendOtp(email);
}

// Verify an OTP for this email (this is the "Verify OTP" action).
// Returns { valid: true } or { valid: false, message }.
function verifyOtp(email, otp) {
  const current = otpData[email];

  if (!current) {
    return { valid: false, message: "No OTP found for this email." };
  }
  if (current.used) {
    return { valid: false, message: "This OTP has already been used." };
  }
  if (Date.now() > current.expiresAt) {
    return { valid: false, message: "This OTP has expired." };
  }
  if (otp !== current.otp) {
    return { valid: false, message: "Incorrect OTP." };
  }

  // Correct and valid. Mark it used so it cannot be used again.
  current.used = true;
  return { valid: true };
}

module.exports = {
  sendOtp: sendOtp,
  resendOtp: resendOtp,
  verifyOtp: verifyOtp
};