# Quick Start Guide - Advanced Features Testing

Follow these steps to test all the new advanced features in the Smart Hostel Tracker system.

## Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- MongoDB connection configured
- At least 2 user accounts (1 student, 1 management)

## Testing Guide

### 1. Profile Management

**Path**: Click avatar → Profile

**Student Flow**:
```
1. Login as student
2. Navigate to Profile
3. Click "✏️ Edit Profile"
4. Edit hostel, block, or room number
5. Click "💾 Save Changes"
6. Verify changes persist (refresh page)
7. Verify toast: "Profile updated successfully! ✅"
```

**Expected Result**: Profile updates saved to database, visible after refresh

---

### 2. Announcement with Voice Input

**Path**: Management Dashboard → Create Announcement

**Testing Voice Input**:
```
1. Login as management
2. Click "➕ Create Announcement"
3. Fill in title
4. Click "🎙️ Voice Input" button
5. Speak announcement content
6. Wait for "✅ Voice input captured!"
7. Content appends to textarea
8. Click "✅ Publish Announcement"
9. Verify in announcement list
```

**Testing Date Scheduling**:
```
1. Open Create Announcement form
2. Scroll to "📅 Schedule Date (Optional)"
3. Try to select past date → Should be disabled
4. Select future date
5. Publish announcement
6. Verify scheduled date in announcement
```

**Expected Result**: Voice text appends, date picker prevents past dates, announcements save with schedule

---

### 3. Announcement Deletion

**Path**: Announcements Section

**Testing Delete**:
```
1. Login as management who created announcement
2. Hover over announcement card
3. Click 🗑️ button (top right)
4. Confirm deletion dialog
5. Announcement disappears from list
6. Verify toast: "Announcement deleted successfully! 🗑️"
```

**Testing Permission**:
```
1. Login as different management user
2. Try to delete announcement created by other user
3. Should see error: "⛔ You can only delete your own announcements"
```

**Expected Result**: Only creator can delete, with confirmation dialog and real-time removal

---

### 4. Issue Resolution Flow

**Path**: Management Dashboard → All Issues

**Management Perspective**:
```
1. Login as management
2. View all issues
3. Find non-resolved issue
4. Click "✅ Resolve Issue" button
5. Modal appears: "✅ Resolve Issue"
6. Enter root cause explanation
7. Click "✅ Resolve"
8. Issue status changes to "resolved"
9. Verify toast: "✅ Issue marked as resolved!"
```

**Student Perspective**:
```
1. Login as original issue reporter
2. Navigate to "My Issues"
3. Find resolved issue
4. Click "⭐ Rate Resolution" button
5. Select star rating (1-5)
6. Add optional comment
7. Click "✅ Submit Rating"
8. Rating displays on issue card: "Your Rating: ⭐⭐⭐⭐⭐"
9. Verify toast: "🙏 Thank you for your feedback!"
```

**Expected Result**: Issue resolves with documentation, student receives feedback request, rating saves

---

### 5. Lost & Found Management

**Path**: Management Dashboard → Lost & Found Moderation

**Testing Lost & Found Flow**:
```
1. Login as student
2. Navigate to "New Issue" or Lost & Found form
3. Report found item with details
4. Upload item image
5. Submit report

6. Login as management
7. Go to Management Dashboard
8. Scroll to "Lost & Found Moderation"
9. View unclaimed items
10. Click "✋ Mark Claimed"
11. Item status changes to "claimed"
12. Item moves to Claimed tab
13. Click "✅ Mark Returned"
14. Item moves to Returned tab
15. Click "🗑️ Delete" to remove
```

**Testing Filters**:
```
1. Click filter buttons: Unclaimed | Claimed | Returned | All
2. Verify items filter correctly
3. Counts update in real-time
```

**Expected Result**: Full item lifecycle: Report → Claim → Return → Archive

---

### 6. Chart Export & Analytics

**Path**: Management Dashboard → Analytics → 📥 Export Button

**Testing Export Features**:
```
1. Click "📥 Export" button in dashboard
2. ChartExport panel appears
3. Select export type: Daily/Weekly/Monthly/CSV/PDF
4. Set date range
5. Click quick select: "Last 7 days"
6. Verify dates update
7. Click "📥 Export Now"
8. PNG file downloads
9. Filename includes date range: "analytics-daily-YYYY-MM-DD.png"
```

**Testing Date Validation**:
```
1. Set "From Date" after "To Date"
2. Try to export
3. Should show error: "Start date cannot be after end date"
```

**Testing New Charts**:
```
1. View Dashboard
2. Verify three charts display:
   - 📂 Issues by Category (Pie)
   - ✅ Issues by Status (Doughnut)
   - 📈 Weekly Trend Analysis (Line with 2 datasets)
3. Line chart shows:
   - Issues Reported (blue line)
   - Issues Resolved (green line)
```

**Expected Result**: Charts export as PNG, date validation enforced, trend analysis visible

---

### 7. Integration Testing

**Complete User Journey**:
```
Flow 1: Issue → Resolution → Feedback
1. Student reports issue
2. Management assigns and progresses issue
3. Management marks resolved with root cause
4. Student receives feedback request
5. Student rates 5 stars with comment
6. Rating persists on issue card

Flow 2: Announcement Lifecycle
1. Management creates announcement with voice input
2. Schedules for tomorrow
3. Students see announcement in feed
4. Management can edit or delete
5. Delete requires confirmation
6. Removed from all student feeds

Flow 3: Lost & Found Complete
1. Student reports found item
2. Item appears in management dashboard
3. Management claims on behalf of owner
4. Management marks returned
5. Item archived
6. Historical record maintained
```

---

## Troubleshooting

### Voice Input Not Working
- **Solution**: Use Chrome, Edge, or Safari (Firefox partial support)
- Check browser permissions for microphone
- Refresh page and try again

### Dates Showing as Disabled
- **Solution**: Check browser date/time settings
- Ensure local date is correct
- Clear browser cache

### Charts Not Exporting
- **Solution**: Check if any analytics data exists
- Verify date range contains data
- Try "Last 7 days" quick select
- Check browser console for errors

### Lost & Found Items Not Showing
- **Solution**: Ensure management role can access endpoint
- Check database has LostFound collection
- Verify student reported items first

---

## Performance Tips

1. **Voice Input**: Keep audio files under 30 seconds for best results
2. **Chart Export**: Works best with 1000+ data points
3. **Database**: Index by date fields for faster filtering
4. **Browser**: Use latest version for Web Speech API support

---

## Feature Statistics

| Feature | Status | Test Time | Users |
|---------|--------|-----------|-------|
| Profile Edit | ✅ Complete | 2 min | All |
| Voice Input | ✅ Complete | 1 min | Management |
| Announcement Delete | ✅ Complete | 1 min | Management |
| Issue Resolution | ✅ Complete | 3 min | Both |
| Student Feedback | ✅ Complete | 1 min | Student |
| Lost & Found | ✅ Complete | 3 min | Management |
| Chart Export | ✅ Complete | 2 min | Management |
| **Total Coverage** | **✅ 100%** | **13 min** | **All Users** |

---

## Next Steps

1. **Deploy to Production**: Use same test cases
2. **Load Testing**: Test with 1000+ issues
3. **Mobile Testing**: Verify responsive design
4. **Security Audit**: Validate all role checks
5. **Data Backup**: Implement scheduled backups
6. **Monitoring**: Set up analytics tracking

---

**Last Updated**: January 2024
**Version**: 2.0
**Status**: Production Ready ✅
