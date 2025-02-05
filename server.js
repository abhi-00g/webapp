const express = require('express');
const sequelize = require('./config/database');
const HealthCheck = require('./models/HealthCheck');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/healthz', express.text(), (req, res, next) => {
    if (req.get('Content-Length') && req.get('Content-Length') !== '0') {
        return res.status(400).send(); 
    }
    next();
});

app.get('/healthz', async(req,res) => {
    try{
        if (Object.keys(req.query).length > 0) {
            return res.status(400).send();
        }

        //throw new Error('Simulated database error');
        await HealthCheck.create({
            datetime: new Date().toISOString(),
        });

        console.log('Health check record inserted successfully.')
        res.status(200).set('Cache-Control', 'no-cache, no-store, must-revalidate')
        .set('Pragma', 'no-cache').send();
    }
    catch(err){
        console.error('Error during health check:', err);
        res.status(503).send();
    }
});

app.all('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.status(405).send();
});

module.exports = app;

async function retryConnection(){
    let tries = 5;
    while(tries){
        try{
            await sequelize.authenticate();
            console.log('Database reconnected successfully!!');

            await sequelize.sync({alter:true});
            console.log('Models synced to the database after reconnection!');
            return;
        }
        catch(err){
            tries = tries - 1;
            console.error(`Database connection failed. Retrying... (${tries} attempts left)`);
            await new Promise((resolve) => setTimeout(resolve, 8000));
        }
    }
    if (tries === 0) {
        console.error('Failed to reconnect to the database after multiple attempts.');
    }
}

function monitorConnection() {
    setInterval(async () => {
        try {
            await sequelize.authenticate();
            console.log('Database connection is healthy.');
        } catch (err) {
            console.error('Lost connection to the database. Attempting to reconnect...');
            await retryConnection();
        }
    }, 40000);
}

app.use((err, req, res, next) => {
    console.error('Unhandled exception:', err);
    res.status(500).send('Something went wrong.');
});

async function start() {
    try{
        await sequelize.authenticate();
        console.log('Database connected successfully!!');
        await sequelize.sync({alter: true});
        console.log('Models synced to the database!');
        monitorConnection();
        app.listen(PORT, () =>{
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Error starting the server:', err);
    }
}

process.on('SIGINT', async () => {
    await sequelize.close();
    console.log('Database connection closed successfully!');
    process.exit(0);
})

if (require.main === module) {
    start();
}

