# Archive Folder

This folder contains historical SQL files that are no longer needed for normal database setup but are kept for reference.

## Archived Files

### Migration Scripts (Already Applied)
- `add_confirmed_status.sql` - Added 'Confirmed' status to Orders table
- `remove_assigned_status.sql` - Removed 'Assigned' status from Orders table
- These changes are now integrated into `ddl_complete.sql`

### Test/Validation Scripts
- `test_database.sql` - Database validation queries
- `test_stage2_manufacturer.sql` - Manufacturer tier tests
- `test_stage3_distributor.sql` - Distributor tier tests
- `validate_stage1.sql` - Stage 1 validation
- These can be used for testing specific features

### Legacy Files
- `ddl.sql` - Original empty DDL file
- `dml.sql` - Original DML file
- `enhanced_test_data.sql` - Additional test data
- `run_stage1_migration.sql` - Stage 1 migration runner

## Usage

These files are for reference only. The current database setup should use:
- `../ddl_complete.sql` for schema creation
- `../dml_complete.sql` for sample data

## Note

Do not run these files unless you specifically need to test or validate historical functionality. The current complete files include all necessary features and updates.
