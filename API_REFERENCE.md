# API Endpoints Reference & Testing Guide

## 🔐 Authentication Endpoints

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@hostel.com",
  "password": "password123",
  "role": "student",  // "student" or "management"
  "hostel": "Hostel A",
  "block": "Block 1",
  "room": "101"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@hostel.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🐛 Issue Endpoints

### Create Issue
```bash
POST /api/issues
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "category": "Plumbing",
  "priority": "high",  // low, medium, high, emergency
  "description": "Water leak in bathroom",
  "visibility": "public",  // public or private
  "media": [file1, file2] // optional
}
```

### Get All Issues (for current user)
```bash
GET /api/issues
Authorization: Bearer {token}

Response:
- Students: public issues + their own issues
- Management: all issues
```

### Get My Issues
```bash
GET /api/issues/my/issues
Authorization: Bearer {token}

Response: Only user's reported issues
```

### Update Issue Status
```bash
PATCH /api/issues/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "In Progress"  // Reported, Assigned, In Progress, Resolved, Closed
}
```

### Assign Issue
```bash
PATCH /api/issues/{id}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "assignedTo": "John Doe"  // Staff/caretaker name
}
```

### Add Me Too Support
```bash
POST /api/issues/{id}/metoo
Authorization: Bearer {token}

Response: Updated issue with incremented meTooCount
```

### Add Issue Feedback
```bash
POST /api/issues/{id}/feedback
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,  // 1-5
  "comment": "Issue resolved quickly and professionally"
}
```

### Set Root Cause
```bash
PATCH /api/issues/{id}/rootcause
Authorization: Bearer {token}
Content-Type: application/json

{
  "rootCause": "wear_tear",  // infrastructure, wear_tear, user_misuse, weather, vendor_delay
  "vendorType": "internal"   // internal or external
}
```

### Merge Duplicate Issues
```bash
POST /api/issues/merge
Authorization: Bearer {token}
Content-Type: application/json

{
  "mainId": "issue_id_1",
  "dupIds": ["issue_id_2", "issue_id_3"]
}
```

---

## 📢 Announcement Endpoints

### Create Announcement
```bash
POST /api/announcements
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Water Maintenance Schedule",
  "content": "Water will be shut off on Sunday 9 AM - 5 PM for maintenance",
  "targetHostel": "Hostel A",  // optional
  "targetBlock": "Block 1",    // optional
  "targetRole": "student"      // optional
}
```

### Get Announcements
```bash
GET /api/announcements
Authorization: Bearer {token}

Response: Filtered by user's hostel and role
```

---

## 💬 Interaction Endpoints

### Create Comment/Reaction
```bash
POST /api/interactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "comment",  // comment or reaction
  "content": "This is happening in my room too!",
  "parentId": "issue_id",
  "parentType": "Issue"  // Issue or Announcement
}
```

### Get Interactions (Comments)
```bash
GET /api/interactions?parentId={issue_id}
Authorization: Bearer {token}

Response: All comments for the issue
```

### Add Emoji Reaction
```bash
POST /api/interactions/{id}/reaction
Authorization: Bearer {token}
Content-Type: application/json

{
  "reaction": "👍"  // emoji character
}
```

### Delete Comment
```bash
DELETE /api/interactions/{id}
Authorization: Bearer {token}

// Only owner can delete
```

---

## 📊 Analytics Endpoints

### Get Dashboard Analytics
```bash
GET /api/analytics/dashboard
Authorization: Bearer {token}

Response:
{
  "categories": [
    { "_id": "Plumbing", "count": 15 },
    { "_id": "Electrical", "count": 8 },
    ...
  ],
  "pendingResolved": [
    { "_id": "Reported", "count": 5 },
    { "_id": "Resolved", "count": 12 },
    ...
  ],
  "avgTime": 2.5,  // hours
  "density": [...]
}
```

### Get Predictive Analytics
```bash
GET /api/analytics/predictive
Authorization: Bearer {token}

Response: Forecast of recurring issues by month
```

### Get Root Cause Clustering
```bash
GET /api/analytics/clustering
Authorization: Bearer {token}

Response: Issues grouped by location, category, time
```

---

## 🔍 Lost & Found Endpoints

### Report Lost/Found Item
```bash
POST /api/lostfound
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "type": "lost",  // lost or found
  "description": "Black wallet with student ID",
  "location": "Cafeteria, Table 5",
  "date": "2024-01-25",
  "images": [file1, file2]  // optional
}
```

### Get All Lost & Found Items
```bash
GET /api/lostfound
Authorization: Bearer {token}
```

### Update Item Status
```bash
PATCH /api/lostfound/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "claimed"  // lost, found, claimed
}
```

---

## 🧪 Testing with cURL

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@hostel.com",
    "password": "password123"
  }'
```

### Test Get All Issues
```bash
curl -X GET http://localhost:5000/api/issues \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Create Issue
```bash
curl -X POST http://localhost:5000/api/issues \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Electrical",
    "priority": "high",
    "description": "Lights flickering in hallway",
    "visibility": "public"
  }'
```

### Test Me Too
```bash
curl -X POST http://localhost:5000/api/issues/ISSUE_ID/metoo \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Environment Variables (.env)

```
# Backend
MONGO_URI=mongodb://localhost:27017/hostel-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=5000
NODE_ENV=development

# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📝 Role-Based Access Rules

### Student Can:
- ✅ Register and login
- ✅ Create (report) issues
- ✅ View public issues
- ✅ View their own issues
- ✅ Add comments on public issues
- ✅ Click "Me Too" on issues
- ✅ View announcements for their hostel
- ✅ Report lost/found items
- ✅ Add feedback after issue resolved

### Student CANNOT:
- ❌ Create announcements
- ❌ View private issues of others
- ❌ Update issue status
- ❌ Assign issues
- ❌ Access analytics
- ❌ Moderate lost/found claims

### Management Can:
- ✅ All student permissions
- ✅ View all issues (public + private)
- ✅ Update issue status
- ✅ Assign issues to staff
- ✅ Create announcements
- ✅ Target announcements by hostel/block/role
- ✅ Set root cause for issues
- ✅ View analytics dashboard
- ✅ Moderate lost/found claims

---

## 🎯 Common Issues & Solutions

### "Token expired"
- User needs to login again (JWT token expires in 1 hour)
- Frontend automatically shows login form

### "Issue not showing in My Issues"
- Ensure issue was created with authenticated user
- Check browser console for API errors
- Verify token is being sent in Authorization header

### "Me Too button not incrementing"
- Check that user is authenticated
- Look for 404 errors (issue might not exist)
- Refresh page to see updated count

### "Charts not showing colors"
- Ensure Analytics controller is returning category data
- Check browser dev tools Network tab for API responses
- Verify Chart.js library is installed: `npm install chart.js react-chartjs-2`

---

## 📱 Testing Workflow

1. **Register** as a student
2. **Report** an issue from StudentDashboard
3. **Verify** it appears in "Your Issues"
4. **Navigate** to Home page, check public issues
5. **Add Comment** on an issue
6. **Click Me Too** on another issue
7. **Login** as management user
8. **View** all issues in Management Dashboard
9. **Check** the analytics with colored charts
10. **Create** an announcement
11. **Update** an issue status

---

All endpoints are protected with JWT authentication (except register/login).
Always include `Authorization: Bearer {token}` header for authenticated requests.
