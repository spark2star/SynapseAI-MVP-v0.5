# Requirements Document

## Introduction

This document specifies the requirements for a Medication Autocomplete Feature in SynapseAI, an intelligent EMR system for mental health practitioners in India. The feature will enable clinicians to quickly search and select medications with appropriate dosages when creating medication plans, reducing manual data entry and improving accuracy during patient consultations.

## Glossary

- **SynapseAI**: The intelligent Electronic Medical Record (EMR) system for mental health practitioners
- **Medication Autocomplete System**: The software component that provides real-time medication search suggestions
- **Add Medication Modal**: The user interface dialog where clinicians enter medication plan details
- **Medication Name Field**: The text input control where clinicians type medication names
- **Dosage Field**: The text input control where clinicians specify medication dosage
- **Suggestion Dropdown**: The visual list of matching medications displayed below the Medication Name Field
- **Backend API**: The FastAPI server component that processes medication search requests
- **Frontend Client**: The Next.js/TypeScript application that clinicians interact with
- **Medications Database**: The PostgreSQL table storing medication names and common dosages

## Requirements

### Requirement 1

**User Story:** As a mental health clinician, I want to search for medications by typing partial names, so that I can quickly find the correct medication without typing the full name.

#### Acceptance Criteria

1. WHEN the clinician types at least 2 characters in the Medication Name Field, THE Medication Autocomplete System SHALL trigger a search request to the Backend API
2. WHEN the Backend API receives a search query, THE Backend API SHALL perform a case-insensitive search against the Medications Database
3. THE Backend API SHALL return a maximum of 10 matching medication results
4. WHEN the search query contains fewer than 2 characters, THE Medication Autocomplete System SHALL NOT trigger a search request
5. THE Medication Autocomplete System SHALL debounce user input by 300 milliseconds before triggering a search request

### Requirement 2

**User Story:** As a mental health clinician, I want to see medication suggestions with common dosages, so that I can select the appropriate medication and dosage combination in one action.

#### Acceptance Criteria

1. WHEN the Backend API returns search results, THE Frontend Client SHALL display each medication with its common dosages in the Suggestion Dropdown
2. THE Suggestion Dropdown SHALL display each option in the format "[Medication Name] [Dosage]"
3. WHEN the clinician clicks a suggestion in the Suggestion Dropdown, THE Frontend Client SHALL populate the Medication Name Field with the medication name only
4. WHEN the clinician clicks a suggestion in the Suggestion Dropdown, THE Frontend Client SHALL populate the Dosage Field with the dosage value only
5. WHEN the clinician clicks a suggestion, THE Frontend Client SHALL hide the Suggestion Dropdown

### Requirement 3

**User Story:** As a system administrator, I want the medication database to store medication names with their common dosages, so that clinicians can access accurate medication information.

#### Acceptance Criteria

1. THE Medications Database SHALL store medication names as non-nullable strings with a maximum length of 255 characters
2. THE Medications Database SHALL store generic medication names as nullable strings with a maximum length of 255 characters
3. THE Medications Database SHALL store common dosages as a JSON array of strings
4. THE Medications Database SHALL maintain an index on the medication name column for search performance
5. THE Backend API SHALL provide medication data that includes name, generic_name, and common_dosages fields

### Requirement 4

**User Story:** As a mental health clinician, I want the autocomplete feature to integrate seamlessly with the existing Add Medication Modal, so that my workflow is not disrupted.

#### Acceptance Criteria

1. THE Frontend Client SHALL implement the autocomplete feature within the existing Add Medication Modal component
2. THE Medication Autocomplete System SHALL follow the existing SynapseAI project architecture using FastAPI backend and Next.js frontend
3. THE Backend API SHALL use SQLAlchemy ORM for database operations
4. THE Frontend Client SHALL use the existing apiService pattern for making HTTP requests
5. WHEN no matching medications are found, THE Frontend Client SHALL display an empty Suggestion Dropdown

### Requirement 5

**User Story:** As a mental health clinician in India, I want the system to include common psychiatric medications used in Indian practice, so that I can prescribe appropriate medications for my patients.

#### Acceptance Criteria

1. THE Medications Database SHALL include Sertraline with dosages of 25mg, 50mg, and 100mg
2. THE Medications Database SHALL include Escitalopram with dosages of 5mg, 10mg, and 20mg
3. THE Medications Database SHALL include Fluoxetine with dosages of 10mg, 20mg, and 40mg
4. THE Medications Database SHALL include Alprazolam with dosages of 0.25mg, 0.5mg, and 1mg
5. THE Medications Database SHALL include Clonazepam with dosages of 0.25mg, 0.5mg, 1mg, and 2mg
6. THE Medications Database SHALL include Risperidone with dosages of 1mg, 2mg, and 3mg
7. THE Medications Database SHALL include Olanzapine with dosages of 2.5mg, 5mg, and 10mg
