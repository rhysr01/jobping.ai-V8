# Tally Form Field Mapping Guide

This document shows how your Tally form fields map to the database schema.

## Form Fields → Database Columns

### Basic Information
| Tally Form Field | Database Column | Type | Notes |
|-----------------|----------------|------|-------|
| "What's your name?" | `full_name` | TEXT | Single value |
| Email address | `email` | TEXT | Single value, unique |

### Location & Languages
| Tally Form Field | Database Column | Type | Notes |
|-----------------|----------------|------|-------|
| "What is your preferred work location(s)?" | `target_cities` | TEXT[] | Array, max 3 cities |
| "What language(s) can you speak to a professional level?" | `languages_spoken` | TEXT[] | Array of languages |

### Experience & Timing
| Tally Form Field | Database Column | Type | Notes |
|-----------------|----------------|------|-------|
| "What's your target employment start date?" | `target_employment_start_date` | TEXT | New field |
| "How much professional experience do you currently have?" | `professional_experience` | TEXT | 0, 6 months, 1 year, etc. |

### Work Preferences
| Tally Form Field | Database Column | Type | Notes |
|-----------------|----------------|------|-------|
| "How do you want to work?" | `work_environment` | TEXT | Office, Hybrid, Remote |
| "What is your current work authorization status?" | `work_authorization` | TEXT | EU citizen, UK citizen, etc. |
| "What is your entry-level preference?" | `entry_level_preference` | TEXT | Internship, Graduate Programme, etc. |

### Company & Career Preferences
| Tally Form Field | Database Column | Type | Notes |
|-----------------|----------------|------|-------|
| "What companies are your target?" | `company_types` | TEXT[] | Array of company types |
| "Career Path (Choose One or More)" | `career_path` | TEXT[] | Array of career paths |
| Specific roles within career path | `roles_selected` | JSONB | Detailed role selections |

## Field Extraction Logic

The `extractUserData` function uses these patterns to identify fields:

- **name**: Maps to `full_name`
- **email**: Maps to `email`
- **location** or **cities**: Maps to `target_cities` (array)
- **languages**: Maps to `languages_spoken` (array)
- **target_date** or **employment_start**: Maps to `target_employment_start_date`
- **experience** (but not **level**): Maps to `professional_experience`
- **work** + **preference/environment**: Maps to `work_environment`
- **authorization** or **citizen**: Maps to `work_authorization`
- **entry_level** or **level_preference**: Maps to `entry_level_preference`
- **companies** or **target_companies**: Maps to `company_types` (array)
- **career_path** or **career**: Maps to `career_path` (array)
- **roles** or **target_roles**: Maps to `roles_selected` (JSONB)

## Database Schema Alignment

Your current database schema supports:
- ✅ All basic user information
- ✅ Array fields for multi-select options
- ✅ JSONB for complex role selections
- ✅ Email verification workflow
- ✅ User management (active, timestamps)

## Next Steps

1. Configure your Tally form field names to match the extraction patterns
2. Test with sample submissions
3. Monitor the webhook logs for proper field mapping
4. Adjust the extraction patterns if needed based on actual Tally field names
