# Practitioner Profile Feature - Implementation Guide

## Overview

The Practitioner Profile feature allows doctors to manage their professional information, which will be used to auto-populate session reports. This includes personal details, clinic information, and a professional logo.

---

## Implementation Summary

### Backend Changes

#### 1. Database Model Updates
**File:** `backend/app/models/user.py`

Added new fields to the `UserProfile` model:
- `clinic_name` (EncryptedType(255)) - Clinic or practice name
- `clinic_address` (Text) - Full clinic address
- `logo_url` (String(500)) - URL path to uploaded professional logo

#### 2. Database Migration
**File:** `backend/alembic/versions/8253387f4357_add_practitioner_profile_fields.py`

Run the migration to add the new columns:
```bash
cd backend
alembic upgrade head
```

#### 3. Pydantic Schemas
**File:** `backend/app/schemas/profile.py`

New schemas created:
- `PractitionerProfileBase` - Base schema with validation
- `PractitionerProfileUpdate` - Schema for updates
- `PractitionerProfileRead` - Response schema
- `PractitionerProfileUpdateResponse` - Update response wrapper

Features:
- Phone number validation (international format)
- Text field sanitization
- Address length validation
- Security validation via `SecurityValidator`

#### 4. API Endpoints
**File:** `backend/app/api/api_v1/endpoints/profile.py`

**Endpoints:**

**GET `/api/v1/profile/`**
- Retrieves current practitioner's profile
- Returns: `PractitionerProfileRead`
- Authentication: Required (JWT)

**PUT `/api/v1/profile/`**
- Updates profile with optional logo upload
- Content-Type: `multipart/form-data`
- Max file size: 5MB
- Allowed formats: JPG, PNG, WebP
- Automatic old file cleanup
- Returns: `PractitionerProfileUpdateResponse`
- Authentication: Required (JWT)

**Security Features:**
- File type validation (MIME type + extension)
- File size validation
- Unique filename generation
- Automatic cleanup of old logos
- Audit logging for all changes
- Transaction rollback on errors

#### 5. Static Files Configuration
**File:** `backend/app/main.py`

- Mounted `/static` directory for serving uploaded logos
- Auto-creates `./static/logos/` directory if not exists

---

### Frontend Changes

#### 1. TypeScript Interfaces
**File:** `frontend/src/types/index.ts`

Added interfaces:
- `PractitionerProfile` - Profile data structure
- `PractitionerProfileUpdate` - Update payload
- `PractitionerProfileUpdateResponse` - API response

#### 2. Profile Page Component
**File:** `frontend/src/app/dashboard/profile/page.tsx`

**Features:**
- Responsive form layout
- Real-time validation
- File upload with preview
- Loading states (skeleton loaders)
- Success/error notifications
- Auto-reset functionality
- Character counters
- Disabled states during submission
- Last updated timestamp

**Form Fields:**
- First Name* (required)
- Last Name* (required)
- Email (read-only)
- Phone Number (validated)
- License Number
- Specialization
- Clinic/Practice Name
- Clinic Address (textarea, 1000 char limit)
- Professional Logo (image upload)

**Validation:**
- Client-side validation before submission
- Phone number format validation
- Required field validation
- File type and size validation
- Real-time error display

#### 3. Navigation Integration
**File:** `frontend/src/components/dashboard/DashboardSidebar.tsx`

- Added "Profile" link with `UserCircleIcon`
- Positioned between Billing and Settings
- Active state highlighting

---

## Usage Instructions

### For Developers

#### 1. Run Database Migration
```bash
cd backend
alembic upgrade head
```

#### 2. Start Backend Server
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Start Frontend Server
```bash
cd frontend
npm run dev
```

#### 4. Access Profile Page
1. Login to the application
2. Navigate to Dashboard
3. Click "Profile" in the sidebar
4. Fill in your professional information
5. Upload a logo (optional)
6. Click "Save Changes"

---

### For End Users (Doctors)

#### Accessing Your Profile
1. Log in to SynapseAI
2. Click **"Profile"** in the left sidebar
3. Your profile page will load with any existing information

#### Updating Personal Information
- **First Name & Last Name**: Required fields for your full name
- **Email**: Cannot be changed (displayed for reference)
- **Phone Number**: Enter in international format (e.g., +1 234 567 8900)
- **License Number**: Your medical license number
- **Specialization**: Your area of medical specialization

#### Updating Clinic Information
- **Clinic/Practice Name**: Name of your clinic or practice
- **Clinic Address**: Full address including street, city, state, ZIP
  - Supports multi-line addresses
  - Maximum 1000 characters
  - Character counter displayed

#### Uploading a Professional Logo
1. Click **"Upload Logo"** or **"Change Logo"** button
2. Select an image file:
   - Formats: JPG, PNG, or WebP
   - Maximum size: 5MB
3. Preview will appear immediately
4. Logo will be saved when you click "Save Changes"

**Tips:**
- Use a high-quality, professional logo
- Square images work best (will be displayed as 150x150px)
- Logo will appear on your session reports

#### Saving Changes
1. Review all information
2. Click **"Save Changes"** button
3. Wait for success confirmation
4. Changes are immediately saved to database

#### Resetting Changes
- Click **"Reset"** to reload original data
- Discards all unsaved changes

---

## API Reference

### Get Profile
```bash
curl -X GET "http://localhost:8000/api/v1/profile/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "user-uuid",
  "email": "doctor@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "full_name": "John Smith",
  "clinic_name": "City Medical Center",
  "clinic_address": "123 Medical Drive\nCity, State 12345",
  "phone": "+12345678900",
  "license_number": "MED12345",
  "specialization": "Internal Medicine",
  "logo_url": "/static/logos/user-uuid_abc123_1696089600.jpg",
  "avatar_url": null,
  "updated_at": "2025-09-30T16:30:00Z"
}
```

### Update Profile
```bash
curl -X PUT "http://localhost:8000/api/v1/profile/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "first_name=John" \
  -F "last_name=Smith" \
  -F "clinic_name=City Medical Center" \
  -F "clinic_address=123 Medical Drive, Suite 100" \
  -F "phone=+12345678900" \
  -F "license_number=MED12345" \
  -F "specialization=Internal Medicine" \
  -F "logo=@/path/to/logo.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    // Same structure as GET response
  }
}
```

---

## File Upload Details

### Storage
- **Directory:** `backend/static/logos/`
- **Filename Pattern:** `{user_id}_{uuid}_{timestamp}.{ext}`
- **Example:** `abc123_def456_1696089600.jpg`

### Security
- File type validation by MIME type AND extension
- Maximum file size: 5MB
- Automatic cleanup of old logos
- Unique filenames prevent collisions
- Files stored outside database for performance

### Cleanup Behavior
- When a new logo is uploaded, the old logo file is automatically deleted
- Prevents storage bloat
- Failed uploads don't leave orphaned files

---

## Validation Rules

### Phone Number
- Format: International format `+1234567890`
- Accepts: Numbers, spaces, dashes, parentheses
- Strips formatting before storage
- Regex: `^\+?[1-9]\d{1,14}$`

### Text Fields
- Sanitized via `SecurityValidator.sanitize_input()`
- Trimmed whitespace
- XSS protection

### File Upload
- MIME types: `image/jpeg`, `image/png`, `image/webp`
- Extensions: `.jpg`, `.jpeg`, `.png`, `.webp`
- Max size: 5,242,880 bytes (5MB)

---

## Error Handling

### Backend Errors
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - User or profile not found
- `413 Request Entity Too Large` - File exceeds 5MB
- `415 Unsupported Media Type` - Invalid file type
- `500 Internal Server Error` - Server error (file save, database)

### Frontend Handling
- Displays user-friendly error messages
- Highlights invalid fields
- Prevents form submission on validation errors
- Auto-scrolls to error messages

---

## Security Features

### Backend Security
- JWT authentication required
- Input sanitization
- SQL injection prevention (SQLAlchemy ORM)
- File type validation (content-based)
- Filename sanitization
- Audit logging for all changes
- Transaction rollback on errors
- Encrypted PII fields (first_name, last_name, etc.)

### Frontend Security
- Client-side validation
- File type checking
- Size validation before upload
- XSS prevention
- HTTPS recommended for production

---

## Testing Checklist

### Backend Testing
- [ ] GET profile with valid token
- [ ] GET profile with invalid token (401)
- [ ] UPDATE profile without logo
- [ ] UPDATE profile with logo
- [ ] UPDATE profile with invalid file type (415)
- [ ] UPDATE profile with oversized file (413)
- [ ] UPDATE profile with invalid phone number
- [ ] Verify old logo cleanup
- [ ] Verify audit logging
- [ ] Test concurrent updates

### Frontend Testing
- [ ] Page loads correctly
- [ ] Form populates with existing data
- [ ] Required field validation
- [ ] Phone number validation
- [ ] Logo upload and preview
- [ ] File type validation
- [ ] File size validation
- [ ] Success message display
- [ ] Error message display
- [ ] Reset button functionality
- [ ] Loading states
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Dark mode compatibility

---

## Future Enhancements

### Suggested Features
1. **Image Processing**
   - Auto-resize and compress uploaded images
   - Generate thumbnails
   - Convert to WebP for better compression
   - Strip EXIF data

2. **Image Cropping**
   - Allow users to crop logo before upload
   - Rotate and adjust images
   - Preview multiple sizes

3. **Additional Fields**
   - Multiple clinic locations
   - Professional certifications
   - Languages spoken
   - Availability schedule

4. **Profile Completion**
   - Progress indicator
   - Suggested fields to complete
   - Onboarding wizard

5. **Auto-save**
   - Save drafts automatically
   - Undo/redo functionality
   - Keyboard shortcuts (Ctrl+S)

---

## Troubleshooting

### Common Issues

**Issue: Logo upload fails**
- Check file size (must be < 5MB)
- Verify file format (JPG, PNG, WebP only)
- Check `static/logos/` directory permissions
- Verify disk space

**Issue: Profile not loading**
- Check JWT token validity
- Verify user is authenticated
- Check backend server is running
- Check database connection

**Issue: Phone number validation fails**
- Use international format (+1234567890)
- Remove special characters
- Check for leading zeros

**Issue: Old logo not deleted**
- Check file permissions on `static/logos/` directory
- Verify cleanup function is working
- Check logs for errors

---

## File Structure

```
MVP_v0.5/
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │       └── 8253387f4357_add_practitioner_profile_fields.py
│   ├── app/
│   │   ├── api/
│   │   │   └── api_v1/
│   │   │       ├── api.py (updated)
│   │   │       └── endpoints/
│   │   │           └── profile.py (new)
│   │   ├── models/
│   │   │   └── user.py (updated)
│   │   ├── schemas/
│   │   │   ├── __init__.py (updated)
│   │   │   └── profile.py (new)
│   │   └── main.py (updated)
│   └── static/
│       └── logos/ (created automatically)
└── frontend/
    └── src/
        ├── app/
        │   └── dashboard/
        │       └── profile/
        │           └── page.tsx (new)
        ├── components/
        │   └── dashboard/
        │       └── DashboardSidebar.tsx (updated)
        └── types/
            └── index.ts (updated)
```

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `backend/backend.log`
3. Check frontend console for errors
4. Verify environment variables are set correctly
5. Ensure database migration has been run

---

## Version History

**v1.0.0** - Initial Implementation (2025-09-30)
- Basic profile management
- Logo upload functionality
- Validation and security
- Audit logging
- Responsive UI

---

## License

Part of the SynapseAI MVP project.
