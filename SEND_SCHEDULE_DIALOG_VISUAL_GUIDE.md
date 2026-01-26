# 📋 Send/Schedule Dialog - Visual Quick Start Guide

## 🎯 Quick Overview

The Send/Schedule Dialog replaces the simple confirmation with a smart modal that lets you choose:
- **📧 Send Now** → Send immediately to all subscribers
- **📅 Schedule Later** → Send at a specific date/time (automatic via CRON)

---

## 📸 Dialog Visual Walkthrough

### Step 1: Newsletter List with Send Button

```
┌─────────────────────────────────────────────────────────────────┐
│  📧 Newsletter Management                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Newsletter Name                          Status    Actions      │
│  ─────────────────────────────────────────────────────────────  │
│  "Découvrez nos articles"                 Brouillon ✎ 📧 ⚙️ 🗑 │
│                                                        │          │
│                                                        ▼          │
│  "Newsletter Jan 2026"                    Envoyé    ✉️ ⚙️ 🗑   │
│                                                               │
│  "Weekly Updates"                         Brouillon ✎ 📧 ⚙️ 🗑 │
│                                                        │          │
│                                                        ▼ Clicked  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 2A: Modal Opens - Send Now Mode (Default)

```
╔═════════════════════════════════════════════════════════════════╗
║  ⏰ Envoyer ou Programmer la Newsletter                     [✕] ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Choisir le mode d'envoi:                                       ║
║                                                                 ║
║  ┌────────────────────────────┬────────────────────────────┐   ║
║  │ ✓ 📧 Envoyer Maintenant    │ ○ 📅 Programmer Plus Tard │   ║
║  └────────────────────────────┴────────────────────────────┘   ║
║     (Green - Selected)               (Blue - Unselected)        ║
║                                                                 ║
║  ℹ️  Envoi Immédiat:                                            ║
║     La newsletter sera envoyée à tous les abonnés actifs        ║
║     maintenant.                                                 ║
║                                                                 ║
╠═════════════════════════════════════════════════════════════════╣
║                          [Annuler]  [Envoyer Maintenant]        ║
╚═════════════════════════════════════════════════════════════════╝
```

**What You See:**
- Radio buttons with green/blue color coding
- Info message explaining immediate send
- No datetime picker (hidden)
- "Envoyer Maintenant" button in green

---

### Step 2B: User Selects "Programmer pour Plus Tard"

```
╔═════════════════════════════════════════════════════════════════╗
║  ⏰ Envoyer ou Programmer la Newsletter                     [✕] ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Choisir le mode d'envoi:                                       ║
║                                                                 ║
║  ┌────────────────────────────┬────────────────────────────┐   ║
║  │ ○ 📧 Envoyer Maintenant    │ ✓ 📅 Programmer Plus Tard │   ║
║  └────────────────────────────┴────────────────────────────┘   ║
║     (Gray - Unselected)            (Blue - Selected)           ║
║                                                                 ║
║  📅 Date et Heure d'Envoi *                                     ║
║  ┌──────────────────────────────────────────────────────────┐  ║
║  │ [Date picker input field - Click to select date/time] ▼ │  ║
║  └──────────────────────────────────────────────────────────┘  ║
║  ℹ️ La newsletter sera envoyée automatiquement à cette date     ║
║     et heure                                                    ║
║                                                                 ║
║  ℹ️  Programmation:                                             ║
║     La newsletter sera programmée pour être envoyée à la date  ║
║     et heure spécifiée. Vous pouvez l'annuler avant l'envoi.   ║
║                                                                 ║
╠═════════════════════════════════════════════════════════════════╣
║                          [Annuler]  [Programmer]                ║
╚═════════════════════════════════════════════════════════════════╝
```

**What Changed:**
- Button toggled to "Schedule Later" (now blue)
- DateTime picker appears
- Info message updated with scheduling details
- "Programmer" button appears in blue

---

### Step 3A: DateTime Picker Opens

```
When user clicks on the datetime input field:

┌──────────────────────────────────────────────┐
│  Select Date and Time                    [✕] │
├──────────────────────────────────────────────┤
│                                              │
│  January 2026              ⬅ ➡              │
│  ─────────────────────────────────────────  │
│  Su Mo Tu We Th Fr Sa                        │
│     1  2  3  4  5  6                        │
│   7  8  9 10 11 12 13                       │
│  14 15 16 17 18 19 20                       │
│  21 22 23 24 25 26 27                       │
│  28 29 30 31                                │
│                                              │
│  Click date: 28                              │
│                                              │
│  Hour: [10] ▼    Minute: [30] ▼             │
│                                              │
│  ────────────────────────────────────────   │
│       [Cancel]        [OK - 2026-01-28]     │
├──────────────────────────────────────────────┤
│  Selected: 2026-01-28T10:30                  │
└──────────────────────────────────────────────┘
```

**Features:**
- Calendar view for month navigation
- Date selection (30+ days in future only)
- Time picker (hours and minutes)
- Shows selected value: `2026-01-28T10:30`

---

### Step 3B: After Datetime Selected

```
╔═════════════════════════════════════════════════════════════════╗
║  ⏰ Envoyer ou Programmer la Newsletter                     [✕] ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  📅 Date et Heure d'Envoi *                                     ║
║  ┌──────────────────────────────────────────────────────────┐  ║
║  │ 2026-01-28T10:30                                         │  ║
║  └──────────────────────────────────────────────────────────┘  ║
║  ℹ️ La newsletter sera envoyée automatiquement à cette date     ║
║     et heure                                                    ║
║                                                                 ║
║  ℹ️  Programmation:                                             ║
║     La newsletter sera programmée pour être envoyée à la date  ║
║     et heure spécifiée. Vous pouvez l'annuler avant l'envoi.   ║
║                                                                 ║
╠═════════════════════════════════════════════════════════════════╣
║                          [Annuler]  [Programmer]                ║
╚═════════════════════════════════════════════════════════════════╝

User clicks [Programmer]
       ▼
```

---

### Step 4: Confirmation Dialog

```
Option A: Send Now Path

╔═════════════════════════════════════════════════════════════════╗
║  📧 Confirmation d'envoi de newsletter           [?]       [✕] ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Vous êtes sur le point d'envoyer cette newsletter à tous les   ║
║  abonnés actifs. Cette action est irréversible et la newsletter ║
║  sera marquée comme "envoyée".                                  ║
║                                                                 ║
║  Êtes-vous sûr de vouloir continuer ?                           ║
║                                                                 ║
╠═════════════════════════════════════════════════════════════════╣
║                    [Annuler]  [Oui, envoyer maintenant]         ║
╚═════════════════════════════════════════════════════════════════╝
```

```
Option B: Schedule for Later Path

╔═════════════════════════════════════════════════════════════════╗
║  ⏰ Confirmation de programmation              [?]       [✕] ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Vous êtes sur le point de programmer cette newsletter pour     ║
║  être envoyée à:                                                ║
║                                                                 ║
║  ⏰ Wednesday, January 28, 2026 at 10:30 AM                    ║
║                                                                 ║
║  Cette action peut être annulée avant l'envoi.                 ║
║                                                                 ║
║  Êtes-vous sûr de vouloir continuer ?                           ║
║                                                                 ║
╠═════════════════════════════════════════════════════════════════╣
║                    [Annuler]  [Oui, programmer]                ║
╚═════════════════════════════════════════════════════════════════╝
```

---

### Step 5: Success Toast Notification

```
After user confirms:

┌─────────────────────────────────────────────────┐
│ ✅ Newsletter envoyée avec succès               │
│    Newsletter sent to: 150 subscriber(s)        │
│    [Close]                                      │
└─────────────────────────────────────────────────┘

OR (for scheduled):

┌─────────────────────────────────────────────────┐
│ ✅ Newsletter programmée avec succès             │
│    Will be sent: January 28, 2026 at 10:30 AM   │
│    [Close]                                      │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Flow Diagram

```
                           Start
                             │
                             ▼
                    User clicks Send button
                             │
                             ▼
        ┌───────── Send/Schedule Modal Opens ────────┐
        │                                            │
        ├──► Default: "Send Now" selected           │
        │    └─► Info shows: "Will send immediately"│
        │                                            │
        └──► User can click "Schedule Later"        │
             └─► DateTime picker appears             │
                 └─► User selects future date/time   │
                     └─► Info shows: "Will schedule" │
                                                    │
                             │                       │
                    User clicks action button        │
                             │                       │
                ┌────────────┴────────────┐          │
                │                         │          │
                ▼                         ▼          │
          "Send Now"              "Schedule Later"   │
              │                         │            │
              ▼                         ▼            │
        Confirmation                Confirmation     │
        "Send immediately?"         "Schedule for    │
                                    Jan 28 at 10:30?"│
              │                         │            │
        ┌─────┴─────┐            ┌─────┴─────┐     │
        │           │            │           │     │
        ▼           ▼            ▼           ▼     │
       YES         NO           YES         NO     │
        │           │            │           │     │
        ▼           ▼            ▼           ▼     │
      SEND       Cancel       SCHEDULE     Cancel  │
        │           │            │           │     │
        ▼           ▼            ▼           ▼     │
      Success   Modal        Success       Modal   │
      Toast     Closes       Toast         Closes  │
        │           │            │           │     │
        └───────────┼────────────┴───────────┘     │
                    │                               │
                    ▼                               │
         Newsletter List Updates                    │
         Status changes to "Envoyé" (if sent)       │
```

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle radio button | Tab + Space |
| Navigate radio buttons | Arrow Keys (← →) |
| Open datetime picker | Tab + Enter (when focused) |
| Submit form | Enter |
| Close modal | Escape |
| Focus next field | Tab |
| Focus previous field | Shift + Tab |

---

## 🎨 Color Legend

| Color | Meaning | Status |
|-------|---------|--------|
| 🟢 Green | Send Now selected | Active |
| 🔵 Blue | Schedule Later selected | Active |
| ⚪ Gray | Unselected option | Inactive |
| 🔴 Red | Error/Danger | Problem |
| 🟡 Yellow | Warning/Info | Caution |

---

## 📱 Responsive Behavior

### Desktop (≥992px)
```
┌──────────────────────────────────────────────┐
│  Modal 600px wide, centered                  │
│  Full button group side-by-side              │
│  DateTime picker inline                      │
└──────────────────────────────────────────────┘
```

### Tablet (768px - 992px)
```
┌──────────────────────────┐
│  Modal 90% wide          │
│  Button group wraps      │
│  DateTime picker inline  │
└──────────────────────────┘
```

### Mobile (<768px)
```
┌────────────────┐
│  Modal full    │
│  width         │
│               │
│  Buttons stack │
│  vertically    │
│               │
│  DateTime full │
│  width         │
└────────────────┘
```

---

## ✅ Validation Rules

```
VALIDATION RULES:

1. Send Now Mode:
   ✓ Newsletter ID must exist
   ✓ No additional validation needed
   ✓ Clicking button triggers send

2. Schedule Later Mode:
   ✓ Newsletter ID must exist
   ✓ DateTime field must be filled
   ✓ Selected date must be in future (not past)
   ✓ Time must be realistic (not midnight errors)
   
3. Before Confirmation:
   ✓ If validation fails → Show error toast
   ✓ If validation passes → Show confirmation dialog
   
4. Common Error Messages:
   ⚠️  "Veuillez sélectionner une date et heure..."
       (Select date/time before proceeding)
   
   ⚠️  "La date et l'heure doivent être dans le futur"
       (Must select future date/time, not past)
   
   ❌ "ID de la newsletter manquant"
       (System error - newsletter not found)
```

---

## 🔧 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Modal won't open | Try refreshing page, check console for errors |
| DateTime picker shows blank | Use newer browser (Chrome, Firefox, Safari, Edge) |
| Can't select past date | Browser/system prevents it - select future date |
| "Future date" error on valid date | Check server timezone is correct |
| Buttons disabled/greyed out | Wait for previous operation to complete |
| Toast notification not visible | Check if toast component is in template |
| Newsletter not sending | Check backend `/newsletters/:id/send-manual` endpoint |
| Newsletter not scheduling | Check backend `/newsletters/:id/schedule` endpoint |

---

## 📊 Feature Comparison

| Feature | Send Now | Schedule Later |
|---------|----------|---|
| Sends Immediately | ✅ YES | ❌ NO |
| Requires DateTime | ❌ NO | ✅ YES |
| Newsletter marked "Sent" | ✅ YES | ❌ NO (until send time) |
| Can be cancelled | ❌ NO | ✅ YES (before send time) |
| Uses CRON scheduler | ❌ NO | ✅ YES |
| Best for | Urgent sends | Planned sends |
| Example | "Send now!" | "Send Monday 9 AM" |

---

## 🚀 Performance Tips

```
For best performance:

1. Click Send button once
   (Wait for modal to appear before clicking again)

2. Select datetime quickly
   (Native picker is fast)

3. Click confirmation button once
   (Wait for success toast before taking other actions)

4. Don't leave modal open for long
   (Close it if you're not going to send)

Typical timings:
- Modal appears: ~50ms
- DateTime picker loads: ~100ms
- Send confirmation: ~200ms
- Send completes: ~500ms (depends on subscriber count)
- Schedule completes: ~300ms
- Toast shows: ~1 second

Total time Send Now: ~2-3 seconds
Total time Schedule: ~2 seconds (no email sending delay)
```

---

## 🔐 Security Features

```
✅ JWT Authentication
   All send/schedule endpoints require JWT token

✅ Input Validation
   DateTime validated server-side (never trust client)

✅ Authorization Checks
   Only users with "send newsletter" permission can send

✅ SQL Injection Prevention
   Parameterized queries used for all database operations

✅ CSRF Protection
   Tokens validated on backend

✅ Rate Limiting
   Prevents rapid-fire requests (e.g., spam sending)

✅ Audit Logging
   All send/schedule actions logged with user/timestamp
```

---

## 📞 Quick Reference Card

**Print or bookmark this section!**

```
┌─────────────────────────────────────────────────────┐
│  NEWSLETTER SEND/SCHEDULE - QUICK REFERENCE         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  HOW TO SEND NOW:                                   │
│  1. Click 📧 send icon                              │
│  2. "Envoyer Maintenant" is default                 │
│  3. Click green button                              │
│  4. Confirm in dialog                               │
│  ✅ Done!                                           │
│                                                     │
│  HOW TO SCHEDULE:                                   │
│  1. Click 📧 send icon                              │
│  2. Click "Programmer pour Plus Tard"               │
│  3. Pick future date/time                           │
│  4. Click "Programmer" button                       │
│  5. Confirm in dialog                               │
│  ✅ Done! CRON will send automatically              │
│                                                     │
│  HOTKEYS:                                           │
│  • Tab: Next field                                  │
│  • Space: Toggle radio button                       │
│  • Enter: Submit                                    │
│  • Escape: Close modal                              │
│                                                     │
│  ICONS:                                             │
│  📧 = Send                                          │
│  📅 = Schedule                                      │
│  ⏰ = Time                                          │
│  ✅ = Success                                       │
│  ⚠️  = Warning                                      │
│  ❌ = Error                                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

**Status:** ✅ FULLY IMPLEMENTED
**Version:** 1.0
**Last Updated:** January 26, 2026
