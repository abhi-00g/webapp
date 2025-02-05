#!/bin/bash

set -e

# Update and Upgrade the System
echo "Updating and upgrading system packages"
sudo apt update -y && sudo apt upgrade -y

# Install Required Packages like PostgreSQL, Node.js, npm, etc
echo "Installing PostgreSQL, Node.js, and npm."
sudo apt install -y postgresql postgresql-contrib nodejs npm unzip 

# Start PostgreSQL
echo "Starting PostgreSQL service..."
sudo systemctl enable postgresql
sudo systemctl start postgresql

read -rsp "enter database password: " DB_PASSWORD
echo

if [ -z "$DB_PASSWORD" ]; then
  echo "please enter the password"
  exit 1
fi

#Configuring the Database 
echo "Configuring Database"

sudo -u postgres psql <<EOF

ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
ALTER USER postgres WITH SUPERUSER;
EOF

# Create a health_check_db database
echo "Creating database 'health_check_db'..."
sudo -u postgres psql -c "CREATE DATABASE health_check_db;"

# Create a Linux Group and User for the Application
APP_GROUP="csye6225group"
APP_USER="abhishek"

echo " Creating application group and user..."
sudo groupadd -f $APP_GROUP
sudo useradd -m -g $APP_GROUP -s /bin/bash $APP_USER || true

# Unzip the Application into /opt/csye6225
APP_DIR="/opt/csye6225"
ZIP_FILE="VenkataKrishnaRajAbhishek_Gade_002308213_2.zip"

echo "Unzipping application to $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo unzip -o $ZIP_FILE -d $APP_DIR

# Set Permissions
echo "Setting permissions..."
sudo chown -R $APP_USER:$APP_GROUP $APP_DIR
sudo chmod -R 750 $APP_DIR

# Install Node.js Dependencies Automatically
echo "Installing Node.js dependencies..."
APP_PATH="$APP_DIR/VenkataKrishnaRajAbhishek_Gade_002308213_2/webapp"

if [ -d "$APP_PATH" ]; then
    cd "$APP_PATH"
    if [ -f "package.json" ]; then
        npm install
    else
        echo "Error: package.json not found!"
        exit 1
    fi
else
    echo "Error: Application directory '$APP_PATH' does not exist!"
    exit 1
fi

echo "Setup complete!"