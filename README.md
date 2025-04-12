## Cloud_Assignment  
To build a cloud-native backend application 

## Steps
1. npm init -y   -- this creates a package.json file to manage dependencies
2. npm install sequelize pg pg-hstore dotenv express  -- to install all required packages
3. Sequelize ORM is used, we import sequelize and give database details
4. We then bootstrap the database using sequelize
5. We then create the /healthz endpoint
6. node server.js starts the application, and the start() function is run first
7. monitorConnection() is used to check whether the database is still connected or if the connection is lost
8. If the connection is lost, retryConnection() function helps to retconnect to the database
9. SIGINT signal is used to close the database connection
10. We use npm install --save-dev supertest
11. We use npm install --save-dev jest
12. We then run HealthCheck.test.js by npx tests/HealthCheck.test.js to implement API testing 
   
## Testing
1. curl -X GET http://localhost:3000/healthz -i    -- this will get 200 OK
2. curl -X POST http://localhost:3000/healthz -i    -- this will get 405 Method Not Allowed
3. curl -X GET http://localhost:3000/healthz -d '{"grade":"A"}' -H "Content-Type: application/json" -i    -- this will get 400 Bad Request
4. To close the database connection without stopping the application, we use 
     sudo su - postgres   -- creates a postgres user to manage the database
     /Library/PostgreSQL/17/bin/pg_ctl stop -D /Library/PostgreSQL/17/data   -- stops the server
5. To restart the database server, we use
    /Library/PostgreSQL/17/bin/pg_ctl start -D /Library/PostgreSQL/17/data   -- restarts the server

## Demo
1. For demo, we first download the zip file from canvas
2. We then use npm install to download node_package
3. We create a .env file again and fill the data
4. We then run the application and perform testing
5. The command node tests/HealthCheck.test.js will automate tests and tell us how many test cases passed and how many failed 