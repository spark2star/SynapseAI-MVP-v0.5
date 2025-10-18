# Quick Start: Error Handling and Validation

## Backend Setup

### 1. Rate Limiting is Already Configured

The following endpoints now have rate limiting:

- **Report Signing:** 5 attempts/minute
- **Profile Completion:** 10 attempts/minute

No additional configuration needed - rate limiting uses the existing Redis instance.

### 2. Error Response Format

All endpoints now return structured errors:

```json
{
  "error": "ERROR_CODE",
  "message": "User-friendly message",
  "field": "field_name",
  "retry": true
}
```

### 3. Testing Backend Errors

```bash
# Test file size validation
curl -X POST http://localhost:8000/api/v1/profile/complete \
  -F "qualifications=MBBS" \
  -F "clinic_name=Test Clinic" \
  -F "clinic_address=123 Test St" \
  -F "phone=+919876543210" \
  -F "digital_signature=@large_file.jpg"

# Expected: 413 error with FILE_TOO_LARGE

# Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/v1/reports/test-id/sign \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"password":"test"}'
done

# Expected: 429 error on 6th request
```

## Frontend Setup

### 1. Add Toast Provider

Add to your root layout (`app/layout.tsx`):

```tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

### 2. Use in Forms

```tsx
import { FormInput } from '@/components/common/FormInput';
import { FileUpload } from '@/components/common/FileUpload';
import { LoadingButton } from '@/components/common/LoadingButton';
import { showSuccess, showError } from '@/utils/toast';
import { handleApiError } from '@/utils/errorHandler';
import { validateEmail } from '@/utils/formValidation';

function MyForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setLoading(true);
    try {
      await api.post('/endpoint', { email });
      showSuccess('Success!');
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={setEmail}
        onBlur={() => setEmailError(validateEmail(email))}
        error={emailError}
        required
      />
      
      <LoadingButton
        type="submit"
        loading={loading}
        variant="primary"
      >
        Submit
      </LoadingButton>
    </form>
  );
}
```

### 3. Handle API Errors

```tsx
import { handleApiError, retryWithBackoff } from '@/utils/errorHandler';

// Simple error handling
try {
  await api.post('/endpoint', data);
} catch (error) {
  handleApiError(error, 'Custom message');
}

// With retry
try {
  await retryWithBackoff(
    () => api.post('/endpoint', data),
    3, // max retries
    1000 // base delay
  );
} catch (error) {
  handleApiError(error);
}
```

## Common Patterns

### Pattern 1: Form with Real-time Validation

```tsx
const [value, setValue] = useState('');
const [error, setError] = useState<string | null>(null);

<FormInput
  label="Field"
  name="field"
  value={value}
  onChange={(newValue) => {
    setValue(newValue);
    // Clear error on change
    if (error) setError(null);
  }}
  onBlur={() => {
    // Validate on blur
    setError(validateField(value));
  }}
  error={error}
  required
/>
```

### Pattern 2: File Upload with Validation

```tsx
const [file, setFile] = useState<File | null>(null);
const [fileError, setFileError] = useState<string | null>(null);

<FileUpload
  label="Upload"
  name="file"
  value={file}
  onChange={(newFile) => {
    setFile(newFile);
    // Validate immediately
    setFileError(validateFile(newFile, {
      required: true,
      maxSizeMB: 5,
      allowedFormats: ['jpg', 'png']
    }));
  }}
  error={fileError}
  required
  showPreview
/>
```

### Pattern 3: Submit with Loading State

```tsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  if (!validateForm()) {
    showError('Please fix errors');
    return;
  }

  setLoading(true);
  try {
    await api.post('/endpoint', data);
    showSuccess('Success!');
  } catch (error) {
    handleApiError(error);
  } finally {
    setLoading(false);
  }
};

<LoadingButton
  type="submit"
  loading={loading}
  disabled={!isFormValid}
>
  Submit
</LoadingButton>
```

## Available Validators

```typescript
// Email
validateEmail(email) // Returns error or null

// Phone
validatePhone(phone) // Supports +country code

// Required
validateRequired(value, 'Field Name')

// Length
validateMinLength(value, 2, 'Field Name')
validateMaxLength(value, 100, 'Field Name')

// Password
validatePassword(password) // 8+ chars, uppercase, lowercase, number

// File
validateFile(file, {
  required: true,
  maxSizeMB: 5,
  allowedFormats: ['jpg', 'png']
})

// Specific fields
validateQualifications(qualifications)
validateClinicName(clinicName)
validateAddress(address)

// Combine validators
const validator = combineValidators(
  (v) => validateRequired(v, 'Name'),
  (v) => validateMinLength(v, 2, 'Name')
);
```

## Available Toast Functions

```typescript
showSuccess('Success message')
showError('Error message')
showWarning('Warning message')
showInfo('Info message')

// Loading with dismiss
const dismiss = showLoading('Loading...');
// Later...
dismiss();

// Dismiss all
dismissAll();
```

## Error Handler Functions

```typescript
// Get error message
const message = getErrorMessage(error);

// Get field-specific error
const fieldError = getFieldError(error, 'email');

// Check if retryable
if (isRetryableError(error)) {
  // Show retry button
}

// Handle with toast
handleApiError(error, 'Custom message');

// Retry with backoff
await retryWithBackoff(fn, maxRetries, baseDelay);

// Get validation errors
const errors = getValidationErrors(error);
// Returns: [{ field: 'email', message: 'Invalid email' }]
```

## Testing Checklist

### Backend
- [ ] File upload with oversized file (>5MB)
- [ ] File upload with invalid format
- [ ] Profile completion with missing fields
- [ ] Report signing rate limit (>5 attempts/min)
- [ ] Profile completion rate limit (>10 attempts/min)
- [ ] Invalid password for signing
- [ ] Already completed profile

### Frontend
- [ ] Real-time validation on blur
- [ ] Error clearing on field change
- [ ] Toast notifications appear
- [ ] Loading states work
- [ ] File upload preview works
- [ ] Drag-and-drop works
- [ ] Form submission with errors
- [ ] Retry logic for network errors

## Troubleshooting

### Toast not appearing
- Check if `<Toaster />` is in root layout
- Check browser console for errors
- Verify `react-hot-toast` is installed

### Validation not working
- Check if validator is imported correctly
- Verify field value is not undefined
- Check if error state is being set

### Rate limiting not working
- Verify Redis is running
- Check `REDIS_URL` environment variable
- Check backend logs for rate limit errors

### File upload failing
- Check file size (must be <5MB)
- Check file format (jpg, jpeg, png only)
- Verify GCS credentials are configured
- Check backend logs for upload errors
