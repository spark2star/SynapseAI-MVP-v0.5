# Common Components and Utilities

This directory contains reusable form components and utilities for error handling, validation, and user feedback.

## Components

### FormInput

Text input component with validation and error display.

```tsx
import { FormInput } from '@/components/common/FormInput';
import { validateEmail } from '@/utils/formValidation';

const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState<string | null>(null);

<FormInput
  label="Email Address"
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  onBlur={() => setEmailError(validateEmail(email))}
  error={emailError}
  placeholder="doctor@example.com"
  required
  autoComplete="email"
/>
```

### FormTextarea

Textarea component with validation and character count.

```tsx
import { FormTextarea } from '@/components/common/FormTextarea';

const [address, setAddress] = useState('');
const [addressError, setAddressError] = useState<string | null>(null);

<FormTextarea
  label="Clinic Address"
  name="address"
  value={address}
  onChange={setAddress}
  onBlur={() => setAddressError(validateAddress(address))}
  error={addressError}
  placeholder="Enter full clinic address"
  required
  rows={4}
  maxLength={1000}
/>
```

### FileUpload

File upload component with drag-and-drop, preview, and validation.

```tsx
import { FileUpload } from '@/components/common/FileUpload';

const [signature, setSignature] = useState<File | null>(null);
const [signatureError, setSignatureError] = useState<string | null>(null);

<FileUpload
  label="Digital Signature"
  name="signature"
  value={signature}
  onChange={setSignature}
  error={signatureError}
  accept="image/*"
  maxSizeMB={5}
  allowedFormats={['jpg', 'jpeg', 'png']}
  required
  showPreview
  helpText="Upload your signature image (JPG, PNG)"
/>
```

### LoadingButton

Button component with loading state.

```tsx
import { LoadingButton } from '@/components/common/LoadingButton';

const [loading, setLoading] = useState(false);

<LoadingButton
  type="submit"
  loading={loading}
  disabled={!isFormValid}
  variant="primary"
  size="md"
  fullWidth
>
  Save Profile
</LoadingButton>
```

## Utilities

### Toast Notifications

```tsx
import { showSuccess, showError, showWarning, showInfo, showLoading } from '@/utils/toast';

// Success notification
showSuccess('Profile completed successfully!');

// Error notification
showError('Failed to upload file. Please try again.');

// Warning notification
showWarning('Please complete all required fields.');

// Info notification
showInfo('Your changes have been saved as draft.');

// Loading notification (returns dismiss function)
const dismissLoading = showLoading('Uploading files...');
// Later...
dismissLoading();
```

### Error Handling

```tsx
import { 
  getErrorMessage, 
  handleApiError, 
  isRetryableError,
  retryWithBackoff,
  getValidationErrors 
} from '@/utils/errorHandler';

// Extract user-friendly error message
try {
  await api.post('/profile/complete', data);
} catch (error) {
  const message = getErrorMessage(error);
  showError(message);
}

// Handle API error with toast
try {
  await api.post('/profile/complete', data);
} catch (error) {
  handleApiError(error, 'Failed to complete profile');
}

// Check if error is retryable
try {
  await api.post('/profile/complete', data);
} catch (error) {
  if (isRetryableError(error)) {
    // Show retry button
  }
}

// Retry with exponential backoff
try {
  const result = await retryWithBackoff(
    () => api.post('/profile/complete', data),
    3, // max retries
    1000 // base delay in ms
  );
} catch (error) {
  handleApiError(error);
}

// Get validation errors
try {
  await api.post('/profile/complete', data);
} catch (error) {
  const validationErrors = getValidationErrors(error);
  validationErrors.forEach(({ field, message }) => {
    // Set field-specific errors
  });
}
```

### Form Validation

```tsx
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePassword,
  validateFile,
  validateQualifications,
  validateClinicName,
  validateAddress,
  combineValidators,
} from '@/utils/formValidation';

// Single validation
const emailError = validateEmail(email);

// Combined validation
const nameValidator = combineValidators(
  (value) => validateRequired(value, 'Name'),
  (value) => validateMinLength(value, 2, 'Name'),
  (value) => validateMaxLength(value, 100, 'Name')
);

const nameError = nameValidator(name);

// File validation
const fileError = validateFile(file, {
  required: true,
  maxSizeMB: 5,
  allowedFormats: ['jpg', 'jpeg', 'png'],
});
```

## Complete Form Example

```tsx
import React, { useState } from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { FileUpload } from '@/components/common/FileUpload';
import { LoadingButton } from '@/components/common/LoadingButton';
import { showSuccess, showError } from '@/utils/toast';
import { handleApiError, retryWithBackoff } from '@/utils/errorHandler';
import {
  validateQualifications,
  validateClinicName,
  validateAddress,
  validatePhone,
  validateFile,
} from '@/utils/formValidation';

export default function CompleteProfileForm() {
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [qualifications, setQualifications] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  
  // Error state
  const [errors, setErrors] = useState({
    qualifications: null as string | null,
    clinicName: null as string | null,
    clinicAddress: null as string | null,
    phone: null as string | null,
    logo: null as string | null,
    signature: null as string | null,
  });

  const validateForm = () => {
    const newErrors = {
      qualifications: validateQualifications(qualifications),
      clinicName: validateClinicName(clinicName),
      clinicAddress: validateAddress(clinicAddress),
      phone: validatePhone(phone),
      logo: validateFile(logo, { required: false, maxSizeMB: 5 }),
      signature: validateFile(signature, { required: true, maxSizeMB: 5 }),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('qualifications', qualifications);
      formData.append('clinic_name', clinicName);
      formData.append('clinic_address', clinicAddress);
      formData.append('phone', phone);
      if (logo) formData.append('logo', logo);
      if (signature) formData.append('digital_signature', signature);

      await retryWithBackoff(
        () => api.post('/api/v1/profile/complete', formData),
        2,
        1000
      );

      showSuccess('Profile completed successfully!');
      // Redirect to dashboard
    } catch (error) {
      handleApiError(error, 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormInput
        label="Qualifications"
        name="qualifications"
        value={qualifications}
        onChange={setQualifications}
        onBlur={() => setErrors(prev => ({
          ...prev,
          qualifications: validateQualifications(qualifications)
        }))}
        error={errors.qualifications}
        placeholder="e.g., MBBS, MD (Psychiatry)"
        required
        maxLength={255}
      />

      <FormInput
        label="Clinic Name"
        name="clinicName"
        value={clinicName}
        onChange={setClinicName}
        onBlur={() => setErrors(prev => ({
          ...prev,
          clinicName: validateClinicName(clinicName)
        }))}
        error={errors.clinicName}
        required
      />

      <FormTextarea
        label="Clinic Address"
        name="clinicAddress"
        value={clinicAddress}
        onChange={setClinicAddress}
        onBlur={() => setErrors(prev => ({
          ...prev,
          clinicAddress: validateAddress(clinicAddress)
        }))}
        error={errors.clinicAddress}
        required
        rows={4}
        maxLength={1000}
      />

      <FormInput
        label="Phone Number"
        name="phone"
        type="tel"
        value={phone}
        onChange={setPhone}
        onBlur={() => setErrors(prev => ({
          ...prev,
          phone: validatePhone(phone)
        }))}
        error={errors.phone}
        required
      />

      <FileUpload
        label="Clinic Logo (Optional)"
        name="logo"
        value={logo}
        onChange={setLogo}
        error={errors.logo}
        showPreview
      />

      <FileUpload
        label="Digital Signature"
        name="signature"
        value={signature}
        onChange={setSignature}
        error={errors.signature}
        required
        showPreview
      />

      <LoadingButton
        type="submit"
        loading={loading}
        variant="primary"
        size="lg"
        fullWidth
      >
        Complete Profile
      </LoadingButton>
    </form>
  );
}
```

## Toast Provider Setup

Add the Toaster component to your root layout:

```tsx
// app/layout.tsx
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
