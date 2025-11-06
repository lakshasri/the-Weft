#!/usr/bin/env bash

# Exit on error
set -euo pipefail

# Default MySQL credentials (can be overridden by .env or args)
MYSQL_USER="root"
MYSQL_PASSWORD=""
MYSQL_HOST="localhost"
DB_NAME="scm_db_roles"

# Load .env if present to keep in sync with server config
if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
  # Optionally map DB_ vars to our script vars if present
  if [ -n "${DB_USER:-}" ]; then MYSQL_USER="$DB_USER"; fi
  if [ -n "${DB_PASSWORD:-}" ]; then MYSQL_PASSWORD="$DB_PASSWORD"; fi
  if [ -n "${DB_HOST:-}" ]; then MYSQL_HOST="$DB_HOST"; fi
  if [ -n "${DB_NAME:-}" ]; then DB_NAME="$DB_NAME"; fi
fi

# Check for user-provided credentials
if [ "$#" -ge 1 ]; then
  MYSQL_USER="$1"
fi
if [ "$#" -ge 2 ]; then
  MYSQL_PASSWORD="$2"
fi
if [ "$#" -ge 3 ]; then
  MYSQL_HOST="$3"
fi

# Paths to SQL scripts
DDL_SCRIPT="sql/ddl.sql"
DML_SCRIPT="sql/dml.sql"

# Compose mysql command based on whether a password is provided
function mysql_base() {
  local db="$1" # may be empty for server-level commands
  if [ -n "$MYSQL_PASSWORD" ]; then
    if [ -n "$db" ]; then
      mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -h "$MYSQL_HOST" "$db"
    else
      mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -h "$MYSQL_HOST"
    fi
  else
    if [ -n "$db" ]; then
      mysql -u "$MYSQL_USER" -h "$MYSQL_HOST" "$db"
    else
      mysql -u "$MYSQL_USER" -h "$MYSQL_HOST"
    fi
  fi
}

# Function to execute SQL commands (server-level) with sudo fallback for auth_socket root
function run_sql {
  local sql="$1"
  set +e
  if [ -n "$MYSQL_PASSWORD" ]; then
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -h "$MYSQL_HOST" -e "$sql" >/dev/null 2>&1
  else
    mysql -u "$MYSQL_USER" -h "$MYSQL_HOST" -e "$sql" >/dev/null 2>&1
  fi
  local status=$?
  set -e
  if [ $status -ne 0 ]; then
    echo "(mysql) direct connection failed; trying sudo mysql ..."
    echo "$sql" | sudo mysql
  fi
}

# Create the database
echo "Creating database '$DB_NAME'..."
run_sql "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# Run DDL script
echo "Running DDL script..."
set +e
mysql_base "$DB_NAME" < "$DDL_SCRIPT"
status=$?
set -e
if [ $status -ne 0 ]; then
  echo "(mysql) DDL failed; trying sudo mysql ..."
  sudo mysql "$DB_NAME" < "$DDL_SCRIPT"
fi

# Run DML script
echo "Running DML script..."
set +e
mysql_base "$DB_NAME" < "$DML_SCRIPT"
status=$?
set -e
if [ $status -ne 0 ]; then
  echo "(mysql) DML failed; trying sudo mysql ..."
  sudo mysql "$DB_NAME" < "$DML_SCRIPT"
fi

echo "Database setup complete!"