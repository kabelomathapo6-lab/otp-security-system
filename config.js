// config.js
// All the OTP settings live here so they are easy to change.
// The brief says these should be config variables we can adjust easily.

module.exports = {
  otpLength: 6,              // OTP is 6 digits
  maxRequestsPerHour: 3,     // a user cannot request more than this many OTPs per hour
  expirySeconds: 30,         // an OTP expires after this many seconds
  resendWindowMinutes: 5,    // if resent within this time, the same OTP is resent
  maxResends: 3,             // an OTP cannot be resent more than this many times
  noRepeatHours: 24          // do not reuse the same OTP number for a user within this many hours
};