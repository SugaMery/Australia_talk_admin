# Newsletter Scheduler - Debug & Testing Guide

## 🎯 Overview

The Newsletter component now includes a built-in **Scheduler Debug & Testing Panel** that helps you diagnose and test newsletter scheduling and sending functionality directly from the UI.

---

## 🚀 Quick Start

### Accessing the Debug Panel

1. Navigate to the **Newsletter** section in the admin panel
2. Look for the **bug icon** (🐛) in the top toolbar next to the refresh button
3. Click it to toggle the debug panel

### The Debug Panel Contains:

- ✅ **Scheduler Status Checker** - Real-time scheduler state
- ✅ **Scheduled Newsletters List** - See what's queued to send
- ✅ **Manual Send Tool** - Bypass the scheduler and send immediately
- ✅ **Debug Logs** - Live logging of all operations
- ✅ **Export Functionality** - Save logs for troubleshooting

---

## 📊 Features Explained

### 1. Check Status Button

```
📊 Scheduler Status → [Check Status] [Trigger Check] [Export Logs]
```

**What it does:**
- Fetches current scheduler state from the backend
- Shows server time vs database time
- Displays all scheduled newsletters with their status
- Calculates minutes until each newsletter should send

**Example Output:**
```
✅ Scheduler status loaded successfully
⏰ Server Time: 2026-01-23T12:10:00.000Z
🗄️  Database Time: 2026-01-23T12:10:00.000Z
📋 Found 1 scheduled newsletter(s)
   ⏰ [ID: 32] Copy of Découvrez... - Status: READY TO SEND (-2 min)
```

**What to look for:**
- ⚠️ If `READY TO SEND` appears but emails didn't send → scheduler not running
- ⚠️ If timezone mismatch detected → adjust database timezone
- ✅ If status shows `WAITING` → newsletter is scheduled correctly

---

### 2. Trigger Check Button

```
⚡ Trigger Check
```

**What it does:**
- Forces the scheduler to run a check cycle immediately
- Simulates the automatic minute-by-minute check
- Processes any newsletters that are due to send
- Shows detailed processing logs

**When to use:**
- Testing the scheduler without waiting for the next cycle
- Verifying scheduler is actually running on the backend
- Debugging sending failures

**Example Output:**
```
⚡ Triggering manual scheduler check...
✅ Scheduler check executed successfully
📬 Processing: "Newsletter Name" (ID: 32)
   ✅ Inserted 5 recipients into newsletter_recipients
   📧 Sending to user1@example.com
   📧 Sending to user2@example.com
✅ Newsletter 32 sent successfully
   Sent: 5, Failed: 0
```

---

### 3. Scheduler Status Card

Shows real-time information:

```
Server Time:       2026-01-23 12:10:00
Database Time:     2026-01-23 12:10:00
Timezone Offset:   0 hours
```

**Common Issues:**
- ⚠️ If times don't match → timezone misconfiguration
- ✅ If offset is 0 → timezone is correct (UTC)
- ⚠️ If offset is ±N → check database timezone setting

**Fix timezone issue:**
```sql
-- MySQL: Check current timezone
SELECT NOW(), UTC_TIMESTAMP(), @@global.time_zone, @@session.time_zone;

-- Set to UTC (recommended)
SET GLOBAL time_zone = '+00:00';
SET SESSION time_zone = '+00:00';
```

---

### 4. Scheduled Newsletters Section

Shows all newsletters scheduled for future sending:

```
📋 Scheduled Newsletters
├─ Name: Copy of Découvrez...
│  Status: 🔴 READY TO SEND
│  Minutes until send: -2 (overdue!)
│
└─ Name: Weekly Newsletter
   Status: ⏳ WAITING
   Minutes until send: 15 (waiting...)
```

**Status Meanings:**
- `READY TO SEND` (🔴) - Overdue and should be sending now
- `WAITING` (⏳) - Scheduled but not yet time
- `SENT` (✅) - Already sent

**What to do:**
- If `READY TO SEND` appears, click "Trigger Check" to send it
- If newsletter doesn't send after clicking, check server logs
- If it remains `READY TO SEND`, the scheduler might not be running

---

### 5. Manual Send Tool

**Purpose:** Send newsletters immediately without scheduler

```
📧 Manual Send (Bypass Scheduler)

| ID  | Subject              | Status | Created           | Action     |
|-----|----------------------|--------|-------------------|------------|
| 32  | Weekly Newsletter    | Draft  | 23/01/2026 12:10  | [Send Now] |
| 31  | Promotion Alert      | Sent   | 22/01/2026 14:30  | [Send Now] |
```

**How to use:**
1. Find the newsletter you want to send
2. Click the **[Send Now]** button
3. Confirm in the dialog
4. Watch the debug logs for results

**Important:**
- ✅ Works even if scheduler is broken
- ✅ Useful for testing email configuration
- ✅ Creates recipient records with full tracking
- ⚠️ Will send to ALL active subscribers
- ⚠️ Marks newsletter as sent (is_sent = 1)

**Example Result:**
```
✅ Newsletter sent successfully!
   📧 Sent to: 5 subscribers
   ❌ Failed: 0 subscribers
```

**If there are failures:**
```
✅ Newsletter sent with errors!
   📧 Sent to: 4 subscribers
   ❌ Failed: 1 subscriber
   
Errors:
   • invalid@example.com: SMTP connection failed
```

---

### 6. Debug Logs Console

```
[12:10:05] 📊 Fetching scheduler status...
[12:10:06] ✅ Scheduler status loaded successfully
[12:10:06] ⏰ Server Time: 2026-01-23T12:10:06.000Z
[12:10:06] 🗄️  Database Time: 2026-01-23T12:10:06.000Z
[12:10:07] 📋 Found 1 scheduled newsletter(s)
[12:10:07]    ⏰ [ID: 32] Weekly... - Status: READY TO SEND (-2 min)
```

**Features:**
- ⏰ Timestamps on each log entry
- 📝 Last 50 logs kept for performance
- 🎨 Color-coded status indicators
- 📋 Searchable and scrollable

**Legend:**
- ✅ Success messages
- ❌ Errors
- ⏰ Time-related info
- 📧 Email operations
- 📊 Status checks
- ⚠️ Warnings

---

## 🔧 Common Troubleshooting Scenarios

### Scenario 1: Newsletter shows "READY TO SEND" but didn't send

**Diagnosis:**
1. Click **[Check Status]** - See if it still shows "READY TO SEND"
2. Click **[Trigger Check]** - Force a manual check cycle
3. Watch the debug logs

**Possible Causes:**
- ❌ Scheduler process not running on backend
- ❌ Email configuration (SMTP) not set up
- ❌ No active subscribers in database

**Fix:**
1. Check server logs for scheduler startup message:
   ```
   ✅ Newsletter scheduler STARTED
      • Checking every minute for scheduled newsletters
      • Runs: * * * * * (every minute)
   ```

2. Test SMTP manually using the manual send tool
3. Verify subscribers exist:
   ```sql
   SELECT COUNT(*) FROM subscribers WHERE deleted_at IS NULL;
   ```

---

### Scenario 2: Manual send works but scheduler doesn't

**Diagnosis:**
1. **[Send Now]** sends emails fine ✅
2. Scheduled sending doesn't work ❌
3. Scheduler status shows newsletters but they don't send

**Root Causes:**
- 🕐 **Timezone Mismatch** (most common)
  - Server in EST, Database in UTC
  - Scheduled time never matches actual time
  
- 🔌 **Node-cron not running**
  - `node-cron` package not installed
  - Cron job failed to initialize
  
- 🗄️ **Database connection issue**
  - Scheduler can't reach database
  - Queries return null

**How to Fix:**

**Check 1: Verify Timezone**
```
In Debug Panel:
Server Time:    2026-01-23 12:10:00 (EST)
Database Time:  2026-01-23 17:10:00 (UTC)
⚠️ Timezone Mismatch Detected! Difference: 5 hours
```

**Fix:**
```sql
-- Adjust scheduled times to match server timezone
-- OR
-- Set MySQL to use server timezone
SET GLOBAL time_zone = 'America/New_York';
```

**Check 2: Verify Scheduler Running**
```
Server logs should show:
✅ Newsletter scheduler STARTED
⏱️ [SCHEDULER] Check #1 at 2026-01-23T12:10:00Z
⏱️ [SCHEDULER] Check #2 at 2026-01-23T12:11:00Z
```

If you don't see these:
1. Check if `node-cron` is installed: `npm list node-cron`
2. Check if newsletter scheduler is imported in server.js
3. Restart the server: `npm start`

**Check 3: Verify Database Access**
```sql
-- Scheduler user should be able to query this
SELECT id, name, scheduled_at, is_sent 
FROM newsletters 
WHERE scheduled_at IS NOT NULL 
AND deleted_at IS NULL
LIMIT 5;
```

---

### Scenario 3: SMTP/Email Configuration Issues

**Error Signs:**
```
✅ Newsletter sent successfully!
   📧 Sent to: 0 subscribers
   ❌ Failed: 5 subscribers

Errors:
   • user1@example.com: SMTP connection refused
   • user2@example.com: Authentication failed
```

**Fix:**
1. Verify SMTP settings in database:
   ```sql
   SELECT * FROM mail_settings WHERE active = 1;
   ```

2. Check required fields:
   - `smtp_host` (e.g., smtp.gmail.com)
   - `smtp_port` (e.g., 587 or 465)
   - `smtp_username` (your email)
   - `smtp_password` (app password, not regular password)
   - `from_name` (sender display name)

3. Test with a known good email:
   - Use manual send tool
   - Check if test email receives it
   - Look at debug logs for SMTP error details

---

## 📋 Testing Workflow

### Complete Test (Recommended)

**Step 1: Verify Everything Works**
```
1. Click [Check Status]
   ✓ Verify server and database times match
   ✓ See if any newsletters are scheduled
```

**Step 2: Test Manual Sending**
```
1. Find a draft newsletter
2. Click [Send Now]
3. Check your email (if test subscriber)
4. Verify in debug logs:
   ✅ Newsletter sent successfully!
   📧 Sent to: X subscribers
```

**Step 3: Schedule a Newsletter for 1 Minute from Now**
```
1. Create/edit a newsletter
2. Schedule it for 1 minute in the future
3. Click [Check Status]
   ✓ Should see newsletter in "Scheduled Newsletters"
   ✓ Should show "Minutes until send: 1"
4. Wait or click [Trigger Check]
5. After scheduled time, click [Check Status]
   ✓ Should show "READY TO SEND" or "SENT"
```

**Step 4: Check Results**
```
1. Look at newsletter status: Should be "Sent" with green badge
2. Open Recipients modal to see delivery status
3. Verify all subscribers show "Sent" status
```

---

## 🛠️ API Endpoints (For Reference)

These endpoints power the debug panel:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/newsletters/debug/scheduler-status` | GET | Get scheduler state and scheduled newsletters |
| `/newsletters/:id/send-manual` | POST | Send newsletter immediately (bypass scheduler) |
| `/newsletters/debug/trigger-scheduler` | POST | Force a manual scheduler check cycle |

---

## 📝 Export Debug Logs

**Purpose:** Save logs for sharing with developers

**How to export:**
1. Click **[Export Logs]** button in debug panel
2. File will download as `newsletter-debug-YYYY-MM-DD.log`
3. Share this file for troubleshooting

**What's included:**
- All timestamps
- All operations performed
- Status of each check
- Error messages and details

**Example log file:**
```
[12:10:05] 📊 Fetching scheduler status...
[12:10:06] ✅ Scheduler status loaded successfully
[12:10:06] ⏰ Server Time: 2026-01-23T12:10:06.000Z
[12:10:06] 🗄️  Database Time: 2026-01-23T12:10:06.000Z
[12:10:07] 📋 Found 1 scheduled newsletter(s)
[12:10:07]    ⏰ [ID: 32] Weekly Newsletter - Status: READY TO SEND (-2 min)
[12:10:10] 🚀 Manually sending newsletter 32...
[12:10:11] ✅ Newsletter sent successfully!
[12:10:11]    📧 Sent to: 5 subscribers
[12:10:11]    ❌ Failed: 0 subscribers
```

---

## ✅ Quick Checklist

Before going live with newsletter scheduling:

- [ ] Scheduler starts successfully (see server logs)
- [ ] Manual send works (test with [Send Now])
- [ ] Server and database times match (no timezone mismatch)
- [ ] SMTP settings configured in database
- [ ] At least one subscriber exists
- [ ] Newsletter scheduled successfully shows in status
- [ ] Scheduled newsletter sends automatically
- [ ] Recipients modal shows correct delivery status
- [ ] Debug logs available for troubleshooting

---

## 📞 Support

If you're still having issues:

1. **Export debug logs** and review them
2. **Check server logs** for scheduler startup and operation messages
3. **Verify database** settings and time zones
4. **Test SMTP** manually with [Send Now]
5. **Check email** spam folder in case they ended up there

**Debug Panel Location:**
- 🐛 Bug icon in Newsletter page toolbar
- Next to refresh (↻) and Excel export icons

---

## 🎓 Understanding the Logs

### Success Log Example:
```
[12:10:00] ⏱️  [SCHEDULER] Check #10 at 2026-01-23T12:10:00.000Z
[12:10:01]    ✓ No newsletters ready (checked 10 times)
[12:12:00] ⏰ [SCHEDULER] ALERT! Found 1 newsletter(s) ready to send
[12:12:01] 📬 [SCHEDULER] Processing: "Weekly Newsletter" (ID: 32)
[12:12:02]    ✅ Inserted 5 recipients into newsletter_recipients
[12:12:03]    📧 Sending to john@example.com
[12:12:04]    📧 Sending to jane@example.com
[12:12:05] ✅ [SCHEDULER] Newsletter 32 sent successfully
```

### Error Log Example:
```
[12:10:00] ⏰ [SCHEDULER] ALERT! Found 1 newsletter(s) ready to send
[12:10:01] 📬 [SCHEDULER] Processing: "Promo Newsletter" (ID: 25)
[12:10:02] ❌ [SCHEDULER] Error: No subscribers found
[12:10:03]    Hint: Create subscribers first via the admin panel
```

---

**Last Updated:** January 2026
**Debug Panel Version:** 1.0
