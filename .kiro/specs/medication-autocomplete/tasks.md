# Implementation Plan: Medication Autocomplete Feature

- [x] 1. Create backend database model and migration
  - Create the Medication SQLAlchemy model in `backend/app/models/medication.py` with fields: name (String, indexed), generic_name (String, nullable), common_dosages (JSON)
  - Import the Medication model in `backend/app/models/__init__.py`
  - Generate Alembic migration using `alembic revision --autogenerate -m "add_medications_table"`
  - Apply the migration using `alembic upgrade head`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Create backend Pydantic schemas
  - Create `backend/app/schemas/medication.py` with MedicationBase, MedicationCreate, and MedicationResponse schemas
  - Add validation for name field (min_length=1, max_length=255)
  - Configure schema to work with SQLAlchemy models using `from_attributes = True`
  - _Requirements: 3.5_

- [x] 3. Implement medication search API endpoint
  - [x] 3.1 Create medications router
    - Create `backend/app/api/api_v1/endpoints/medications.py` with APIRouter
    - Implement GET `/search` endpoint with query parameter validation (min_length=2)
    - Use SQLAlchemy to perform case-insensitive ILIKE search with `func.lower()`
    - Limit results to maximum 10 medications
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.2 Register medications router
    - Import medications router in `backend/app/api/api_v1/api.py`
    - Register router with prefix `/medications` and tag `medications`
    - _Requirements: 4.2_

- [x] 4. Seed psychiatric medications database
  - Create SQL seed script or Python script to insert 7 common psychiatric medications
  - Include Sertraline (25mg, 50mg, 100mg), Escitalopram (5mg, 10mg, 20mg), Fluoxetine (10mg, 20mg, 40mg)
  - Include Alprazolam (0.25mg, 0.5mg, 1mg), Clonazepam (0.25mg, 0.5mg, 1mg, 2mg)
  - Include Risperidone (1mg, 2mg, 3mg), Olanzapine (2.5mg, 5mg, 10mg)
  - Execute seed script to populate medications table
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 5. Create frontend TypeScript types
  - Add Medication interface to `frontend/src/types/index.ts` with fields: id, name, generic_name, common_dosages, created_at, updated_at
  - Add MedicationSuggestion interface with medication, dosage, and displayText fields
  - _Requirements: 4.4_

- [x] 6. Extend frontend API service
  - Add `searchMedications(query: string): Promise<Medication[]>` method to `frontend/src/services/api.ts`
  - Implement client-side validation to return empty array if query length < 2
  - Add error handling to return empty array on API failures
  - _Requirements: 1.4, 4.4_

- [x] 7. Install frontend dependencies
  - Install `use-debounce` package using `npm install use-debounce`
  - _Requirements: 1.5_

- [x] 8. Implement autocomplete in SessionSummaryModal
  - [x] 8.1 Add autocomplete state management
    - Add state variables: medicationQuery, medicationSuggestions, showSuggestions, activeMedicationIndex
    - Implement debounced query using `useDebounce` hook with 300ms delay
    - _Requirements: 1.5_
  
  - [x] 8.2 Implement medication search effect
    - Create useEffect that watches debouncedQuery
    - Call apiService.searchMedications when query length >= 2
    - Flatten medication results with their dosages into MedicationSuggestion array
    - Update suggestions state and show dropdown when results exist
    - _Requirements: 1.1, 2.1_
  
  - [x] 8.3 Implement suggestion selection handler
    - Create handleSuggestionClick function that accepts MedicationSuggestion and index
    - Populate drug_name field with medication name
    - Populate dosage field with selected dosage
    - Clear autocomplete state and hide dropdown
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [x] 8.4 Update Drug Name input field UI
    - Modify input onChange to track activeMedicationIndex and update medicationQuery
    - Add onFocus handler to set activeMedicationIndex
    - Add onBlur handler with 200ms delay to allow suggestion clicks
    - Wrap input in relative positioned div for dropdown positioning
    - _Requirements: 4.1_
  
  - [x] 8.5 Create autocomplete dropdown component
    - Render dropdown below Drug Name input when showSuggestions is true
    - Display each suggestion with format "[Name] [Dosage]"
    - Show generic_name as secondary text if available
    - Style with absolute positioning, z-index, max-height with scroll
    - Add hover states and click handlers for each suggestion
    - Support dark mode styling consistent with existing design system
    - _Requirements: 2.1, 2.2, 4.1_

- [ ]* 9. Write backend unit tests
  - Write test for Medication model creation and field validation
  - Write test for case-insensitive search (lowercase and uppercase queries)
  - Write test for query validation (reject queries < 2 characters)
  - Write test for result limit (verify max 10 results returned)
  - Write integration test for full medication search workflow
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 10. Write frontend component tests
  - Write test to verify suggestions appear after typing 2+ characters
  - Write test to verify fields populate correctly when suggestion is clicked
  - Write test to verify no API call with less than 2 characters
  - Write test to verify dropdown hides after selection
  - Write test for debouncing behavior
  - _Requirements: 1.4, 1.5, 2.3, 2.4, 2.5_
