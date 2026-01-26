# 📅 Newsletter Scheduling Feature - Quick Guide

## ✨ What's New

A new **Newsletter Scheduling** feature has been added! Now you can:
- ✅ Send newsletters immediately 
- ✅ Schedule newsletters for a specific date and time
- ✅ Let the system automatically send at the scheduled time

---

## 🎯 How to Use

### Step 1: Click Send Button
In the Newsletter list, click the **"Envoyer la newsletter"** button (📧 icon) on any draft newsletter.

```
Table Row:
[Newsletter ID] [Subject] [Template] [Created] [Status] [Actions]
                                                          ↓
                                        [Edit] [Schedule→] [Duplicate] [Delete]
```

### Step 2: Choose Send Mode

A modal will appear with two options:

```
┌──────────────────────────────────────────┐
│ ⏰ Envoyer ou Programmer la Newsletter  │
├──────────────────────────────────────────┤
│                                          │
│ Choisir le mode d'envoi:                │
│                                          │
│ [📧 Envoyer Maintenant] [⏰ Programmer] │
│                                          │
└──────────────────────────────────────────┘
```

#### Option 1: Envoyer Maintenant (Send Now)
- ✅ Newsletter sends immediately to all active subscribers
- ✅ Newsletter marked as "Sent"
- ✅ Recipients list populated with delivery status

#### Option 2: Programmer (Schedule)
- ⏰ Newsletter scheduled for future date/time
- ⏱️ Scheduler will automatically send at that time
- 🔄 Can be cancelled before sending

---

## 📅 How to Schedule

### Step 1: Select "Programmer pour Plus Tard"
Click the **"⏰ Programmer pour Plus Tard"** button

```
Mode Selection:
[📧 Envoyer Maintenant] [⏰ Programmer pour Plus Tard] ← Click this
```

### Step 2: Pick Date and Time
A date/time picker will appear:

```
┌─────────────────────────────────────────┐
│ Date et Heure d'Envoi                   │
│ [📅 2026-01-28 14:30:00]                │
│                                         │
│ ℹ️ La newsletter sera envoyée            │
│ automatiquement à cette date et heure   │
└─────────────────────────────────────────┘
```

**Choose:**
- 📅 **Date:** When to send (must be in future)
- ⏰ **Time:** What time to send

**Example:**
- Tomorrow at 2:00 PM → `2026-01-28 14:00`
- Next Monday at 9:00 AM → `2026-02-03 09:00`

### Step 3: Confirm Scheduling

Click **"Programmer"** button

```
Modal Footer:
[Annuler] [Programmer] ← Click this
           (or [Envoyer Maintenant] if send mode)
```

### Step 4: Confirm in Dialog

A confirmation appears:

```
⏰ Confirmation de programmation

Vous êtes sur le point de programmer 
cette newsletter pour être envoyée à:

2026-01-28 14:30

Cette action peut être annulée avant l'envoi.

Êtes-vous sûr de vouloir continuer?

[Annuler] [Oui, programmer]
```

Click **"Oui, programmer"** to confirm.

---

## ✅ What Happens Next

### After Scheduling:

1. **Success Message:**
   ```
   ✅ Newsletter programmée avec succès
   Newsletter sera envoyée le 28/01/2026 14:30
   ```

2. **Newsletter Status Updates:**
   - Status badge changes from "Brouillon" to "Programmée"
   - Scheduled time visible in list
   - Can see scheduler status in debug panel

3. **Automatic Sending:**
   - Scheduler checks every minute
   - At scheduled time, automatically sends
   - Recipients list populated with delivery status
   - Newsletter marked as "Sent"

---

## 🔧 Checking Scheduled Newsletters

### In the Debug Panel 🐛

1. Click **🐛 Debug** icon in toolbar
2. Click **[Check Status]**
3. Look for "Scheduled Newsletters" section

```
📋 SCHEDULED NEWSLETTERS
┌─────────────────────────────────────┐
│ Weekly Newsletter                   │
│ Status: ⏳ WAITING                  │
│ Minutes until send: 45              │
│                                     │
│ Promo Newsletter                    │
│ Status: 🔴 READY TO SEND            │
│ Minutes until send: -2 (overdue!)   │
└─────────────────────────────────────┘
```

**Legend:**
- ⏳ **WAITING** = Scheduled, not time yet
- 🔴 **READY TO SEND** = Time to send, might be delayed
- ✅ **SENT** = Already sent

---

## ⚠️ Important Notes

### Time Requirements
- ✅ Date/time must be in the **FUTURE**
- ✅ Cannot schedule in the past
- ❌ Past dates will show error: "La date et l'heure doivent être dans le futur"

### Timezone
- 🌍 Times are in your **server timezone**
- ⏰ Ensure database timezone matches server timezone
- 🔍 Check debug panel for timezone mismatch warning

### Before Sending
- ✅ Ensure subscribers exist
- ✅ Verify SMTP settings configured
- ✅ Test with [Send Now] if unsure

### Cancellation
- ⏸️ Scheduled newsletters can be cancelled
- 🗑️ Delete the newsletter before scheduled time
- ✅ Already sent newsletters cannot be cancelled

---

## 🎯 Common Scenarios

### Scenario 1: Schedule for Tomorrow at 9 AM
```
1. Click "Envoyer la newsletter" button
2. Select "⏰ Programmer pour Plus Tard"
3. Set date: Tomorrow's date
4. Set time: 09:00
5. Click "Programmer"
6. Confirm in dialog
7. ✅ Done! Newsletter scheduled
```

### Scenario 2: Test Email Before Scheduling
```
1. Click "Envoyer la newsletter" button
2. Select "📧 Envoyer Maintenant"
3. Click "Envoyer Maintenant" button
4. Confirm in dialog
5. ✅ Newsletter sent immediately
6. Check email to verify it looks good
7. Schedule next one if satisfied
```

### Scenario 3: Schedule Weekly Newsletter
```
Every Monday at 2 PM:

1. Click "Envoyer la newsletter"
2. Select "⏰ Programmer pour Plus Tard"
3. Set to next Monday at 14:00
4. Click "Programmer"
5. ✅ Scheduled!

Repeat weekly - you can create new newsletter 
for next week's content and schedule it
```

---

## 📊 Monitoring Scheduled Sends

### Using Debug Panel

**Before Send (Waiting):**
```
Click 🐛 → [Check Status]
↓
Status: ⏳ WAITING
Minutes until send: 30
```

**When Ready to Send:**
```
Click 🐛 → [Check Status]
↓
Status: 🔴 READY TO SEND
Minutes until send: -2 (overdue!)
↓
Click [Trigger Check] to send immediately
```

**After Sending:**
```
Click 🐛 → [Check Status]
↓
Status: ✅ SENT
Minutes until send: --
↓
Open Recipients modal to see delivery status
```

---

## 🆘 Troubleshooting

### Issue: "Date/time must be in future"
**Solution:** Select a future date/time, not past

### Issue: Scheduled newsletter didn't send
**Check:**
1. Is server timezone correct? (Debug panel)
2. Are there subscribers? (Check subscribers table)
3. Is SMTP configured? (Try manual send)
4. Is scheduler running? (Check server logs)

**Fix:** Use Debug panel → [Trigger Check] to force send

### Issue: Time picker not appearing
**Solution:** First select "⏰ Programmer pour Plus Tard" radio button

### Issue: Newsletter shows "Programmée" but didn't send
**Check:** Debug panel to see status and error messages

---

## 💡 Tips & Best Practices

✅ **Tip 1:** Test with [Send Now] before scheduling
✅ **Tip 2:** Use debug panel to monitor scheduled sends
✅ **Tip 3:** Schedule at least 1 hour in advance
✅ **Tip 4:** Round times to :00 or :30 for clarity
✅ **Tip 5:** Always verify timezone in debug panel

---

## 📱 UI Elements

### Send/Schedule Modal
```
┌─────────────────────────────────────────┐
│ ⏰ Envoyer ou Programmer Newsletter    │
├─────────────────────────────────────────┤
│                                         │
│ Mode Selection:                         │
│ [📧 Send Now] [⏰ Schedule]             │
│                                         │
│ (If Schedule Selected)                  │
│ Date & Time Picker:                     │
│ [📅 2026-01-28 14:30]                   │
│                                         │
│ ℹ️ Info Box                             │
│                                         │
├─────────────────────────────────────────┤
│ [Annuler] [Send/Schedule] (disabled if) │
│                            loading)     │
└─────────────────────────────────────────┘
```

### Newsletter Status
```
Newsletters List:
[Draft]      - Can edit, schedule, or send
[Scheduled]  - Waiting for scheduler to send
[Sent]       - Already sent, can view recipients
```

---

## 🔄 Newsletter Lifecycle

```
CREATE
  ↓
DRAFT (Edit/Schedule/Send from here)
  ↓
SCHEDULED (Waiting for time)
  ↓  (if immediate) or (if scheduled time reached)
SENT (View recipients)
  ↓
(Optional: Duplicate or Delete)
```

---

## 📞 Need Help?

1. **Immediate Send Issues:** Check SMTP settings
2. **Scheduling Issues:** Check timezone in debug panel
3. **Scheduled Send Not Happening:** Use [Trigger Check] in debug panel
4. **General Questions:** See SCHEDULER_DEBUG_GUIDE.md

---

**Newsletter Scheduling Ready! 🚀**

Start scheduling your newsletters now using the date/time picker feature!

**Last Updated:** January 26, 2026
**Version:** 1.0
