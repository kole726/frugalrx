# Medication Components

This directory contains components for displaying and comparing medication information.

## Components

### MedicationComparison

The `MedicationComparison` component allows users to compare multiple medications side by side. It displays information such as:

- Basic medication information (generic name, brand name)
- Pricing information from nearby pharmacies
- Detailed medication information (dosage, side effects, etc.)

#### Usage

```tsx
import { MedicationComparison } from '@/components/medications';

// Example usage
<MedicationComparison 
  medications={medicationArray}
  latitude={userLocation.latitude}
  longitude={userLocation.longitude}
  radius={10} // optional, in miles
/>
```

#### Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| medications | DrugInfo[] | Array of medications to compare | Yes |
| latitude | number | User's latitude for finding nearby pharmacies | Yes |
| longitude | number | User's longitude for finding nearby pharmacies | Yes |
| radius | number | Search radius in miles | No |

### MedicationAlternatives

The `MedicationAlternatives` component displays alternative medications for a given drug, including generic and therapeutic alternatives. It shows:

- Alternative medication information
- Pricing from nearby pharmacies
- Filtering options for generic vs. therapeutic alternatives

#### Usage

```tsx
import { MedicationAlternatives } from '@/components/medications';

// Example usage
<MedicationAlternatives
  drugName="atorvastatin"
  latitude={userLocation.latitude}
  longitude={userLocation.longitude}
  includeGenerics={true} // optional
  includeTherapeutic={true} // optional
/>
```

#### Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| drugName | string | Name of the medication to find alternatives for | Yes |
| latitude | number | User's latitude for finding nearby pharmacies | Yes |
| longitude | number | User's longitude for finding nearby pharmacies | Yes |
| includeGenerics | boolean | Whether to include generic alternatives | No |
| includeTherapeutic | boolean | Whether to include therapeutic alternatives | No |

## API Integration

These components integrate with the following API endpoints:

- `/api/drugs/compare` - For comparing multiple medications
- `/api/drugs/alternatives` - For finding alternative medications

See the API documentation for more details on these endpoints.

## Demo

A demo of these components can be found at `/medications/demo`, which showcases both components in action. 