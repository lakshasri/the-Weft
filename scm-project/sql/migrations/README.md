# Migrations Folder

This folder contains placeholder migration files from development. 

## Migration Files (Empty Placeholders)

1. **`001_add_manufacturer_inventory.sql`** - Empty (functionality in ddl_complete.sql)
2. **`002_add_distributor_tables.sql`** - Empty (functionality in ddl_complete.sql)
3. **`003_add_retailer_orders.sql`** - Empty (functionality in ddl_complete.sql)
4. **`004_enhance_existing_tables.sql`** - Empty (functionality in ddl_complete.sql)

## Current State

**These files are empty.** All database schema and functionality has been consolidated into the main `ddl_complete.sql` file. The incremental migrations were applied directly during development rather than being saved in these files.

## Usage

**Do not run these migration files individually.** Instead, use the complete setup:

```bash
cd /path/to/scm-project/sql
./setup_database.sh
```

Or manually:
```bash
sudo mysql -u root < ddl_complete.sql
sudo mysql -u root < dml_complete.sql
```

## Note

These migrations were applied incrementally during development. The current `ddl_complete.sql` includes all changes from all migrations in a single, clean schema definition.
