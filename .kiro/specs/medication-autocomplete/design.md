# Design Document: Medication Autocomplete Feature

## Overview

The Medication Autocomplete Feature enhances the SynapseAI EMR system by providing intelligent, real-time medication search capabilities within the Session Summary Modal. This feature reduces manual data entry for clinicians by allowing them to search for medications and automatically populate both the medication name and dosage fields with a single click.

### Design Goals

1. **Minimize Clinician Effort**: Reduce typing and manual entry during patient consultations
2. **Improve Accuracy**: Provide standardized medication names and dosages from a curated database
3. **Seamless Integration**: Integrate naturally into the existing Session Summary Modal workflow
4. **Performance**: Deliver fast, responsive search results with minimal API calls
5. **Scalability**: Support future expansion of the medication database

### Technology Stack

- **Backend**: FastAPI with SQLAlchemy ORM 2.0, PostgreSQL, Alembic migrations
- **Frontend**: Next.js 14 (App Router), TypeScript, React hooks
- **API Communication**: Axios via existing apiService pattern

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         SessionSummaryModal Component                   │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Medication Name Input (with debounce)           │  │ │
│  │  │  ↓                                                │  │ │
│  │  │  Autocomplete Dropdown                           │  │ │
│  │  │  ↓                                                │  │ │
│  │  │  Selection Handler → Populate Fields             │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕ HTTP                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              apiService.searchMedications()            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     GET /api/v1/medications/search?q={query}          │ │
│  │                                                         │ │
│  │  • Validate query (min 2 chars)                       │ │
│  │  • Case-insensitive ILIKE search                      │ │
│  │  • Return max 10 results                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                       │ │
│  │                                                         │ │
│  │  medications table:                                    │ │
│  │  • id (UUID, PK)                                       │ │
│  │  • name (String, indexed)                             │ │
│  │  • generic_name (String, nullable)                    │ │
│  │  • common_dosages (JSON array)                        │ │
│  │  • created_at, updated_at                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input**: Clinician types in the "Drug Name" field
2. **Debouncing**: Frontend waits 300ms after last keystroke
3. **API Request**: If query ≥ 2 characters, call `/medications/search?q={query}`
4. **Database Query**: Backend performs case-insensitive search with ILIKE
5. **Response**: Backend returns up to 10 matching medications with dosages
6. **Display**: Frontend renders dropdown with "Name Dosage" format
7. **Selection**: User clicks suggestion → fields auto-populate → dropdown closes

## Components and Interfaces

### Backend Components

#### 1. Database Model (`backend/app/models/medication.py`)

```python
from sqlalchemy import Column, String, JSON, Index
from app.models.base import BaseModel

class Medication(BaseModel):
    """
    Medication model for storing drug information and common dosages.
    """
    __tablename__ = "medications"
    
    # Medication name (brand or generic)
    name = Column(String(255), nullable=False, index=True)
    
    # Generic/scientific name (optional)
    generic_name = Column(String(255), nullable=True)
    
    # Array of common dosage strings (e.g., ["25mg", "50mg", "100mg"])
    common_dosages = Column(JSON, nullable=True)
    
    # Index for fast case-insensitive search
    __table_args__ = (
        Index('ix_medications_name_lower', 
              'name', 
              postgresql_ops={'name': 'text_pattern_ops'}),
    )
```

**Design Rationale**:
- Inherits from `BaseModel` for consistent `id`, `created_at`, `updated_at` fields
- `name` is indexed for fast search performance
- `common_dosages` stored as JSON for flexibility (supports variable-length arrays)
- `generic_name` allows future expansion for generic/brand name mapping

#### 2. Pydantic Schema (`backend/app/schemas/medication.py`)

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MedicationBase(BaseModel):
    """Base medication schema with core fields."""
    name: str = Field(..., min_length=1, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    common_dosages: Optional[List[str]] = Field(default_factory=list)

class MedicationCreate(MedicationBase):
    """Schema for creating new medications."""
    pass

class MedicationResponse(MedicationBase):
    """Schema for medication API responses."""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

**Design Rationale**:
- Separates concerns: Base, Create, and Response schemas
- Validation ensures data integrity (min/max lengths)
- `from_attributes = True` enables SQLAlchemy model conversion

#### 3. API Endpoint (`backend/app/api/api_v1/endpoints/medications.py`)

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.models.medication import Medication
from app.schemas.medication import MedicationResponse

router = APIRouter()

@router.get("/search", response_model=List[MedicationResponse])
async def search_medications(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    db: Session = Depends(get_db)
):
    """
    Search medications by name (case-insensitive).
    Returns up to 10 matching results.
    """
    try:
        # Case-insensitive ILIKE search
        search_pattern = f"%{q}%"
        medications = db.query(Medication)\
            .filter(func.lower(Medication.name).like(func.lower(search_pattern)))\
            .limit(10)\
            .all()
        
        return medications
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
```

**Design Rationale**:
- Query parameter validation enforces minimum 2 characters
- Uses SQLAlchemy's `func.lower()` for case-insensitive search
- Limits results to 10 for performance and UX
- Returns standardized error responses

#### 4. Router Registration (`backend/app/api/api_v1/api.py`)

```python
# Add to imports
from app.api.api_v1.endpoints import medications

# Add to router includes
api_router.include_router(
    medications.router, 
    prefix="/medications", 
    tags=["medications"]
)
```

### Frontend Components

#### 1. TypeScript Types (`frontend/src/types/index.ts`)

```typescript
export interface Medication {
  id: string
  name: string
  generic_name: string | null
  common_dosages: string[]
  created_at: string
  updated_at: string
}

export interface MedicationSuggestion {
  medication: Medication
  dosage: string
  displayText: string  // "Sertraline 50mg"
}
```

**Design Rationale**:
- Matches backend schema exactly
- `MedicationSuggestion` combines medication + specific dosage for UI rendering
- `displayText` pre-computed for performance

#### 2. API Service Extension (`frontend/src/services/api.ts`)

```typescript
/**
 * Search medications by name
 * @param query - Search query (minimum 2 characters)
 * @returns Array of matching medications
 */
async searchMedications(query: string): Promise<Medication[]> {
  if (query.length < 2) {
    return []
  }
  
  try {
    const response = await this.api.get('/medications/search', {
      params: { q: query }
    })
    return response.data
  } catch (error) {
    console.error('Medication search error:', error)
    return []
  }
}
```

**Design Rationale**:
- Client-side validation prevents unnecessary API calls
- Graceful error handling returns empty array (no UI disruption)
- Follows existing apiService pattern

#### 3. SessionSummaryModal Enhancement

**State Management**:
```typescript
// New state for autocomplete
const [medicationQuery, setMedicationQuery] = useState('')
const [medicationSuggestions, setMedicationSuggestions] = useState<MedicationSuggestion[]>([])
const [showSuggestions, setShowSuggestions] = useState(false)
const [activeMedicationIndex, setActiveMedicationIndex] = useState<number | null>(null)

// Debounced query
const debouncedQuery = useDebounce(medicationQuery, 300)
```

**Search Effect**:
```typescript
useEffect(() => {
  const searchMedications = async () => {
    if (debouncedQuery.length < 2) {
      setMedicationSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    const results = await apiService.searchMedications(debouncedQuery)
    
    // Flatten medications with their dosages
    const suggestions: MedicationSuggestion[] = []
    results.forEach(med => {
      if (med.common_dosages && med.common_dosages.length > 0) {
        med.common_dosages.forEach(dosage => {
          suggestions.push({
            medication: med,
            dosage: dosage,
            displayText: `${med.name} ${dosage}`
          })
        })
      } else {
        // No dosages available, show medication name only
        suggestions.push({
          medication: med,
          dosage: '',
          displayText: med.name
        })
      }
    })
    
    setMedicationSuggestions(suggestions)
    setShowSuggestions(suggestions.length > 0)
  }
  
  searchMedications()
}, [debouncedQuery])
```

**Selection Handler**:
```typescript
const handleSuggestionClick = (suggestion: MedicationSuggestion, index: number) => {
  // Populate the active medication fields
  const updated = [...medicationPlan]
  updated[activeMedicationIndex!] = {
    ...updated[activeMedicationIndex!],
    drug_name: suggestion.medication.name,
    dosage: suggestion.dosage
  }
  setMedicationPlan(updated)
  
  // Clear autocomplete state
  setMedicationQuery('')
  setShowSuggestions(false)
  setMedicationSuggestions([])
}
```

**UI Component**:
```tsx
<div className="relative">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Drug Name <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    value={activeMedicationIndex === index ? medicationQuery : med.drug_name}
    onChange={(e) => {
      setActiveMedicationIndex(index)
      setMedicationQuery(e.target.value)
      handleMedicationChange(index, 'drug_name', e.target.value)
    }}
    onFocus={() => setActiveMedicationIndex(index)}
    onBlur={() => {
      // Delay to allow click on suggestion
      setTimeout(() => setShowSuggestions(false), 200)
    }}
    placeholder="e.g., Sertraline"
    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-800 dark:text-white"
  />
  
  {/* Autocomplete Dropdown */}
  {showSuggestions && activeMedicationIndex === index && medicationSuggestions.length > 0 && (
    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {medicationSuggestions.map((suggestion, idx) => (
        <button
          key={`${suggestion.medication.id}-${suggestion.dosage}`}
          type="button"
          onClick={() => handleSuggestionClick(suggestion, index)}
          className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-neutral-700 transition-colors border-b border-gray-100 dark:border-neutral-700 last:border-b-0"
        >
          <div className="font-medium text-gray-900 dark:text-white">
            {suggestion.displayText}
          </div>
          {suggestion.medication.generic_name && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {suggestion.medication.generic_name}
            </div>
          )}
        </button>
      ))}
    </div>
  )}
</div>
```

**Design Rationale**:
- **Debouncing**: Prevents excessive API calls (300ms is industry standard)
- **Active Index Tracking**: Supports multiple medication inputs in the form
- **Flattened Suggestions**: Each medication-dosage combination is a separate clickable item
- **Keyboard-Friendly**: onBlur with delay allows mouse clicks on suggestions
- **Accessibility**: Proper labels, focus states, and semantic HTML
- **Dark Mode Support**: Consistent with existing SynapseAI design system

## Data Models

### Database Schema

```sql
CREATE TABLE medications (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    common_dosages JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX ix_medications_name ON medications(name);
CREATE INDEX ix_medications_name_lower ON medications(name text_pattern_ops);
```

### Sample Data Structure

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Sertraline",
  "generic_name": "Sertraline Hydrochloride",
  "common_dosages": ["25mg", "50mg", "100mg"],
  "created_at": "2025-10-18T10:00:00Z",
  "updated_at": "2025-10-18T10:00:00Z"
}
```

## Error Handling

### Backend Error Scenarios

| Scenario | HTTP Status | Response | Handling |
|----------|-------------|----------|----------|
| Query too short (< 2 chars) | 422 | Validation error | FastAPI automatic validation |
| Database connection failure | 500 | Internal server error | Log error, return generic message |
| No results found | 200 | Empty array `[]` | Normal response, no error |
| Invalid query characters | 200 | Empty array `[]` | Graceful handling, no crash |

### Frontend Error Scenarios

| Scenario | Handling |
|----------|----------|
| Network failure | Return empty array, log error to console |
| API timeout | Return empty array, no user notification |
| Invalid response format | Return empty array, log error |
| No suggestions found | Show empty dropdown or hide dropdown |

**Design Rationale**:
- Autocomplete failures should never block the user workflow
- Users can always manually type medication names
- Silent failures are acceptable for non-critical autocomplete features

## Testing Strategy

### Backend Testing

#### Unit Tests (`backend/tests/unit/test_medications.py`)

```python
def test_medication_model_creation(db_session):
    """Test creating a medication record."""
    med = Medication(
        name="Sertraline",
        generic_name="Sertraline Hydrochloride",
        common_dosages=["25mg", "50mg", "100mg"]
    )
    db_session.add(med)
    db_session.commit()
    
    assert med.id is not None
    assert med.name == "Sertraline"
    assert len(med.common_dosages) == 3

def test_search_medications_case_insensitive(client, db_session):
    """Test case-insensitive medication search."""
    # Seed data
    create_test_medication(db_session, "Sertraline")
    
    # Test lowercase query
    response = client.get("/api/v1/medications/search?q=ser")
    assert response.status_code == 200
    assert len(response.json()) > 0
    
    # Test uppercase query
    response = client.get("/api/v1/medications/search?q=SER")
    assert response.status_code == 200
    assert len(response.json()) > 0

def test_search_medications_min_length(client):
    """Test query validation (minimum 2 characters)."""
    response = client.get("/api/v1/medications/search?q=s")
    assert response.status_code == 422  # Validation error

def test_search_medications_limit(client, db_session):
    """Test result limit (max 10 results)."""
    # Seed 15 medications starting with "S"
    for i in range(15):
        create_test_medication(db_session, f"Medication-S{i}")
    
    response = client.get("/api/v1/medications/search?q=s")
    assert response.status_code == 200
    assert len(response.json()) == 10
```

#### Integration Tests

```python
def test_medication_search_integration(client, db_session):
    """Test full medication search workflow."""
    # Seed psychiatric medications
    seed_psychiatric_medications(db_session)
    
    # Search for "ser"
    response = client.get("/api/v1/medications/search?q=ser")
    assert response.status_code == 200
    
    data = response.json()
    assert any(med['name'] == 'Sertraline' for med in data)
    
    # Verify dosages are included
    sertraline = next(med for med in data if med['name'] == 'Sertraline')
    assert '50mg' in sertraline['common_dosages']
```

### Frontend Testing

#### Component Tests (using React Testing Library)

```typescript
describe('SessionSummaryModal - Medication Autocomplete', () => {
  it('should show suggestions after typing 2+ characters', async () => {
    render(<SessionSummaryModal {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/e.g., Sertraline/)
    fireEvent.change(input, { target: { value: 'ser' } })
    
    // Wait for debounce + API call
    await waitFor(() => {
      expect(screen.getByText(/Sertraline 50mg/)).toBeInTheDocument()
    }, { timeout: 500 })
  })
  
  it('should populate fields when suggestion is clicked', async () => {
    render(<SessionSummaryModal {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/e.g., Sertraline/)
    fireEvent.change(input, { target: { value: 'ser' } })
    
    await waitFor(() => {
      expect(screen.getByText(/Sertraline 50mg/)).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText(/Sertraline 50mg/))
    
    expect(input).toHaveValue('Sertraline')
    expect(screen.getByPlaceholderText(/e.g., 100mg/)).toHaveValue('50mg')
  })
  
  it('should not search with less than 2 characters', async () => {
    const mockSearch = jest.spyOn(apiService, 'searchMedications')
    
    render(<SessionSummaryModal {...defaultProps} />)
    
    const input = screen.getByPlaceholderText(/e.g., Sertraline/)
    fireEvent.change(input, { target: { value: 's' } })
    
    await waitFor(() => {
      expect(mockSearch).not.toHaveBeenCalled()
    }, { timeout: 500 })
  })
})
```

### Manual Testing Checklist

- [ ] Type "ser" → Verify Sertraline appears with dosages
- [ ] Click "Sertraline 50mg" → Verify fields populate correctly
- [ ] Type "alp" → Verify Alprazolam appears
- [ ] Type "xyz" → Verify no results, no errors
- [ ] Type "s" (1 char) → Verify no API call
- [ ] Test with slow network → Verify debouncing works
- [ ] Test dark mode → Verify dropdown styling
- [ ] Test keyboard navigation → Verify accessibility

## Performance Considerations

### Database Optimization

1. **Indexing**: `name` column indexed for fast ILIKE queries
2. **Query Limit**: Hard limit of 10 results prevents large result sets
3. **Connection Pooling**: Existing SQLAlchemy pool configuration handles concurrent requests

### Frontend Optimization

1. **Debouncing**: 300ms delay reduces API calls by ~70% during typing
2. **Memoization**: Consider `useMemo` for suggestion flattening if performance issues arise
3. **Lazy Loading**: Dropdown only renders when visible

### Expected Performance

- **API Response Time**: < 100ms for typical queries (with indexed search)
- **Frontend Render**: < 50ms for dropdown display
- **Total User Experience**: < 500ms from keystroke to visible results

## Security Considerations

1. **SQL Injection**: Prevented by SQLAlchemy parameterized queries
2. **Input Validation**: FastAPI validates query length (min 2 chars)
3. **Rate Limiting**: Existing rate limiting middleware applies to medication endpoint
4. **Authentication**: Endpoint requires valid JWT token (existing auth middleware)
5. **Data Sanitization**: No user-generated content stored in medications table

## Future Enhancements

1. **Fuzzy Matching**: Implement Levenshtein distance for typo tolerance
2. **Generic Name Search**: Search by both brand and generic names
3. **Medication Categories**: Add therapeutic categories for filtering
4. **Usage Analytics**: Track most-searched medications for optimization
5. **Offline Support**: Cache common medications in localStorage
6. **Multi-language Support**: Add medication names in regional languages (Hindi, Marathi)
7. **Drug Interactions**: Integrate with drug interaction databases
8. **Dosage Recommendations**: AI-powered dosage suggestions based on patient data

## Migration Strategy

### Database Migration

```bash
# Generate migration
alembic revision --autogenerate -m "add_medications_table"

# Apply migration
alembic upgrade head
```

### Seed Data Deployment

```bash
# Run seed script
python backend/scripts/seed_medications.py
```

### Rollback Plan

```bash
# Rollback migration
alembic downgrade -1

# Remove router registration (code change)
# Feature gracefully degrades to manual entry
```

## Dependencies

### Backend
- No new dependencies required (uses existing SQLAlchemy, FastAPI)

### Frontend
- `use-debounce` (^9.0.0) - For input debouncing
  ```bash
  npm install use-debounce
  ```

## Acceptance Criteria Mapping

| Requirement | Design Component | Verification |
|-------------|------------------|--------------|
| 1.1 - Trigger search after 2 chars | Debounced input + API validation | Unit test |
| 1.2 - Case-insensitive search | SQLAlchemy `func.lower()` | Integration test |
| 1.3 - Return max 10 results | `.limit(10)` in query | Unit test |
| 1.4 - No search < 2 chars | FastAPI Query validation | Unit test |
| 1.5 - 300ms debounce | `useDebounce` hook | Manual test |
| 2.1 - Display suggestions | Dropdown component | Component test |
| 2.2 - Format "[Name] [Dosage]" | `displayText` property | Component test |
| 2.3 - Populate name field | `handleSuggestionClick` | Component test |
| 2.4 - Populate dosage field | `handleSuggestionClick` | Component test |
| 2.5 - Hide dropdown on click | State management | Component test |
| 3.1-3.5 - Database schema | Medication model + migration | Migration test |
| 4.1-4.5 - Integration | SessionSummaryModal enhancement | Integration test |
| 5.1-5.7 - Seed data | SQL seed script | Manual verification |

## Conclusion

This design provides a robust, scalable medication autocomplete feature that integrates seamlessly with SynapseAI's existing architecture. The implementation prioritizes user experience, performance, and maintainability while following established patterns in the codebase.
