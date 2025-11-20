#!/bin/bash
# Complete Database Setup Script for SCM Project
# This script will drop and recreate the entire database with all tables and sample data

echo "========================================="
echo "SCM Database Setup Script"
echo "========================================="
echo ""
echo "This will:"
echo "1. Drop and recreate all tables"
echo "2. Create all functions, procedures, and triggers"
echo "3. Load sample data for all user roles"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "Step 1/2: Creating database schema..."
sudo mysql -u root < ddl_complete.sql

if [ $? -eq 0 ]; then
    echo "✓ Schema created successfully"
else
    echo "✗ Schema creation failed"
    exit 1
fi

echo ""
echo "Step 2/2: Loading sample data..."
sudo mysql -u root < dml_complete.sql

if [ $? -eq 0 ]; then
    echo "✓ Sample data loaded successfully"
else
    echo "✗ Data loading failed"
    exit 1
fi

echo ""
echo "========================================="
echo "✓ Database setup complete!"
echo "========================================="
echo ""
echo "Sample user accounts:"
echo "  Customer:     alice@example.com / password123"
echo "  Retailer:     retailer1@example.com / password123"
echo "  Distributor:  distributor1@example.com / password123"
echo "  Manufacturer: manufacturer1@example.com / password123"
echo ""
echo "Database: scm_db_roles"
echo "Server: http://localhost:3000"
echo ""
echo "To verify: sudo mysql -u root -e 'USE scm_db_roles; SHOW TABLES;'"
echo ""
