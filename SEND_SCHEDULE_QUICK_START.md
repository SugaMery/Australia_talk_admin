# 📧 Newsletter Send/Schedule - Quick Start (1 Minute Guide)

## 🎯 What Is This?

A smart dialog that lets you **send newsletters immediately** OR **schedule them for later**.

---

## 📋 Quick Steps

### Send Now (Immediate)
```
1. Click 📧 send button on newsletter
2. Modal opens (Send Now is default)
3. Click "Envoyer Maintenant" button
4. Click "Oui, envoyer maintenant" to confirm
✅ Done! Newsletter sent to all subscribers
```

### Schedule Later (Future Date/Time)
```
1. Click 📧 send button on newsletter
2. Modal opens
3. Click "Programmer pour Plus Tard" button
4. Pick date and time from calendar
5. Click "Programmer" button
6. Click "Oui, programmer" to confirm
✅ Done! Newsletter will send automatically at that time
```

---

## 🎨 What You See

```
┌───────────────────────────────────────────┐
│  ⏰ Send or Schedule Newsletter      [X]  │
├───────────────────────────────────────────┤
│  Mode:  [✓ Send Now] [○ Schedule]        │
│                                          │
│  Date/Time: [Only if Schedule selected]  │
│  [Pick date from calendar]               │
│                                          │
│  Info message explains what happens      │
├───────────────────────────────────────────┤
│  [Cancel]  [Send Now] or [Schedule]      │
└───────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| 📧 Send Now | Sends immediately to all subscribers |
| 📅 Schedule | Sends at specific date/time automatically |
| 🔔 Notifications | Toast shows success/error messages |
| ⚙️ Smart Validation | Prevents scheduling in past dates |
| 🌍 French | Complete French interface |
| 📱 Mobile | Works on phone, tablet, desktop |

---

## ⚠️ Important Notes

### Sending Now:
- ❌ Cannot be cancelled once confirmed
- ✅ Sends to all active subscribers
- ✅ Newsletter marked as "Sent" immediately
- ⏱️ Takes ~2-3 seconds

### Scheduling Later:
- ✅ Can be cancelled before send time
- ✅ Sends automatically at scheduled time
- ✅ Newsletter stays in "Draft" status
- ✅ CRON scheduler must be running

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| DateTime picker not showing | Browser may be old - use Chrome/Firefox |
| "Date must be future" error | Select a future date, not past date |
| Modal won't open | Refresh page, clear browser cache |
| Newsletter not sending at scheduled time | Check if scheduler is running on server |
| No toast notification | Check if browser notifications are enabled |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move between fields |
| Space | Toggle radio button |
| Enter | Submit form |
| Escape | Close modal |

---

## 📞 Help

**Need assistance?**

Check these guides:
- [SEND_SCHEDULE_DIALOG_VISUAL_GUIDE.md](SEND_SCHEDULE_DIALOG_VISUAL_GUIDE.md) - Visual walkthrough
- [NEWSLETTER_SCHEDULING_GUIDE.md](NEWSLETTER_SCHEDULING_GUIDE.md) - Detailed scheduling guide
- [SCHEDULER_DEBUG_GUIDE.md](SCHEDULER_DEBUG_GUIDE.md) - Troubleshooting guide

---

**That's it!** You now know how to send and schedule newsletters. 🎉
