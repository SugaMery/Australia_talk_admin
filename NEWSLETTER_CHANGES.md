# Newsletter Component Updates

## Summary
Added comprehensive recipient viewing functionality to the Newsletter component with the ability to see delivery status, recipient information, and statistics for each newsletter.

## Changes Made

### 1. **Fixed `sending_date` Display Issue**
   - **File**: `newsletter.component.html`
   - **Change**: Updated the date display to show `sent_at` date if available, with proper formatting
   - **Before**: `{{ newsletter.sending_date | date: 'dd/MM/yyyy' }}`
   - **After**: `{{ newsletter.sent_at || newsletter.sending_date | date: 'dd/MM/yyyy HH:mm' }}`
   - **Result**: Now displays the actual send date and time when the newsletter was sent

### 2. **Added Recipients Modal Properties**
   - **File**: `newsletter.component.ts`
   - **Changes**:
     ```typescript
     // Recipients modal
     showRecipientsModal: boolean = false;
     newsletterRecipients: any[] = [];
     recipientsLoading: boolean = false;
     recipientsPage: number = 1;
     recipientsLimit: number = 20;
     recipientsTotal: number = 0;
     recipientsTotalPages: number = 0;
     recipientsStats: any = {};
     ```

### 3. **Added Recipients Methods to Component**
   - **File**: `newsletter.component.ts`
   - **Methods Added**:
     - `openRecipientsModal(newsletter)` - Opens the recipients modal
     - `loadRecipients()` - Fetches recipients from API with pagination
     - `onRecipientsPageChange(event)` - Handles pagination changes
     - `closeRecipientsModal()` - Closes the modal
     - `getStatusBadgeClass(status)` - Returns CSS class based on status
     - `getStatusLabel(status)` - Returns French label for status

### 4. **Added Service Method**
   - **File**: `newsletter.service.ts`
   - **Method Added**:
     ```typescript
     getNewsletterRecipients(
       id: string | number,
       page: number = 1,
       limit: number = 50,
       status?: string
     ): Observable<ApiResponse<any>>
     ```
   - **Purpose**: Fetches recipients for a specific newsletter with pagination and optional status filter

### 5. **Updated HTML Template**
   - **File**: `newsletter.component.html`
   - **Changes**:
     - Added "View Recipients" button (envelope icon) in actions column
     - Added Recipients Modal with:
       - Statistics cards showing: Total, Sent, Failed, Pending
       - Recipients table with columns: Email, Name, Status, Send Date, Error Message
       - Pagination controls
       - Loading state indicator
     - Added Modal Backdrop for recipients modal

### 6. **Added CSS Styling**
   - **File**: `newsletter.component.css`
   - **New Styles**:
     - Card styling for statistics display
     - Table hover effects
     - Pagination styling
     - Spinner styling for loading state
     - Modal sizing (modal-lg)

## Features

### Recipients View Modal
When you click the envelope icon (📧) on any newsletter, a modal opens showing:

1. **Statistics Dashboard**:
   - Total recipients
   - Successfully sent count
   - Failed deliveries count
   - Pending deliveries count

2. **Recipients Table**:
   - Email address
   - Recipient name (first + last)
   - Delivery status (badge):
     - ✅ Envoyé (Sent) - Green
     - ❌ Échoué (Failed) - Red
     - ⚠️ Rejeté (Bounced) - Orange
     - ⏳ En attente (Pending) - Gray
   - Date and time of delivery
   - Error message (if delivery failed)

3. **Pagination**:
   - Navigate through recipients with page numbers
   - Shows 20 recipients per page

## Backend Integration

The component uses the existing backend endpoint:
- **Endpoint**: `GET /api/newsletters/:id/recipients`
- **Parameters**:
  - `page` (optional, default: 1)
  - `limit` (optional, default: 50)
  - `status` (optional, filter by status)

**Response Format**:
```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3
  },
  "stats": {
    "total": 150,
    "pending": 20,
    "sent": 120,
    "failed": 10,
    "bounced": 0
  },
  "data": [
    {
      "id": 1,
      "newsletter_id": 5,
      "subscriber_id": 10,
      "email": "user@example.com",
      "sent_at": "2026-01-23T10:30:00Z",
      "status": "sent",
      "error_message": null,
      "created_at": "2026-01-23T10:30:00Z",
      "first_name": "John",
      "last_name": "Doe",
      "template_name": "Newsletter Template",
      "template_slug": "newsletter-template"
    }
  ]
}
```

## Usage

1. Navigate to the Newsletter page
2. Click the envelope icon (📧) next to any newsletter row
3. View the recipient statistics and delivery status
4. Use pagination to browse all recipients
5. Check error messages for failed deliveries
6. Close the modal with the "Fermer" button

## Status Indicators

| Status | Display | Color | Meaning |
|--------|---------|-------|---------|
| `sent` | Envoyé | Green | Email delivered successfully |
| `failed` | Échoué | Red | Email delivery failed |
| `bounced` | Rejeté | Orange | Email bounced (invalid address) |
| `pending` | En attente | Gray | Email pending delivery |

## Date Format
- Display format: `dd/MM/yyyy HH:mm` (e.g., 23/01/2026 10:30)
- Shows both date and time of delivery
- Shows `sent_at` if available, falls back to `sending_date`

## Notes
- Recipients are loaded on demand when opening the modal
- Pagination defaults to 20 recipients per page
- Frontend handles French localization for status labels
- Backend timestamp fields are in ISO 8601 format
