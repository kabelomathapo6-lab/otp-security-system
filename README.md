# OTP Security System

A simple OTP (one time PIN) system built with Node.js and Express for the
Melsoft technical assessment. It has an API that creates and checks OTPs, and a
small frontend with two pages to test it.

## What it does

- Creates a 6 digit OTP for an email address.
- The OTP is "sent" by printing it to the server console (a real system would
  email it, but for this test we log it so it is easy to see and test).
- Lets you verify an OTP for an email and tells you if it is valid.

## How to run it

1. Install Node.js.
2. In the project folder, install the one dependency:

   ```
   npm install
   ```

3. Start the server:

   ```
   node server.js
   ```

4. The server runs on http://localhost:3000. Open these two pages in a browser:
   - Send OTP screen: http://localhost:3000/send.html
   - Verify OTP screen: http://localhost:3000/verify.html

When you send an OTP, look at the server console (the terminal) to see the OTP
number, then type it into the verify screen.

## The two screens

- **Send OTP** (`send.html`): enter an email and click Send OTP. There is also a
  Resend OTP button. This is not a login, it just sends an OTP to the email.
- **Verify OTP** (`verify.html`): enter the email and the OTP and click Verify.
  It tells you whether the OTP is valid.

## Configuration

All the settings are in `config.js` so they are easy to change:

| Setting | Default | Meaning |
|---------|---------|---------|
| otpLength | 6 | how many digits the OTP has |
| maxRequestsPerHour | 3 | most OTPs a user can request in an hour |
| expirySeconds | 30 | how long an OTP is valid for |
| resendWindowMinutes | 5 | resend inside this time resends the same OTP |
| maxResends | 3 | most times one OTP can be resent |
| noRepeatHours | 24 | do not reuse the same OTP number for a user within this time |

## How the rules are handled

All the OTP rules live in `otpStore.js`. The storage is in memory, which means it
resets when the server restarts. That is fine for a test.

- **6 digits, can start with 0:** a random number from 0 to 999999, padded with
  zeros to 6 digits.
- **No repeat within 24 hours:** a short history of recent OTPs per email is
  kept, and a new OTP is rolled again if it matches a recent one.
- **Max 3 requests per hour:** the times of recent requests per email are kept
  and counted.
- **Only the latest OTP is valid:** each new OTP replaces the old one for that
  email.
- **Expires after 30 seconds:** each OTP stores an expiry time that is checked on
  verify.
- **Resend within 5 minutes:** if the current OTP is still inside the resend
  window, the same OTP is resent and its expiry is updated.
- **Max 3 resends:** each OTP counts how many times it has been resent.
- **Cannot be used twice:** an OTP is marked as used after a successful verify.

## Project files

```
config.js        the settings
otpStore.js      the OTP rules and in-memory storage
server.js        the Express API (send, resend, verify)
public/
  send.html      the Send OTP screen
  verify.html    the Verify OTP screen
```

## API routes

- `POST /send` with `{ "email": "..." }` creates and sends a new OTP.
- `POST /resend` with `{ "email": "..." }` resends the OTP (same one if inside the
  resend window, otherwise a new one).
- `POST /verify` with `{ "email": "...", "otp": "..." }` checks the OTP.
