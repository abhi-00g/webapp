const express = require('express');
const multer = require('multer');
const sequelize = require('./config/database');
const File = require('./models/File');
const { uploadFile, deleteFile } = require('./config/s3');
const HealthCheck = require('./models/HealthCheck');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');
const metrics = require('./utils/metrics'); 

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use((req, res, next) => {
    const start = Date.now();
    logger.info(`${req.method} ${req.originalUrl} requested`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} completed in ${duration}ms`);
        metrics.increment(`api.calls.${req.method}.${req.path.replace(/\//g, '_')}`);
        metrics.timing(`api.latency.${req.method}.${req.path.replace(/\//g, '_')}`, duration);
    });

    next();
});

app.use('/v1', router);

app.use('/healthz', express.text(), (req, res, next) => {
    if (req.get('Content-Length') && req.get('Content-Length') !== '0') {
        return res.status(400).send(); 
    }
    next();
});

app.get('/healthz', async(req,res) => {
    try {
        if (Object.keys(req.query).length > 0) {
            return res.status(400).send();
        }

        const tableExists = await sequelize.getQueryInterface().showAllTables();
        if (!tableExists.includes('HealthChecks')) {
            logger.error('HealthCheck table does not exist. Returning 503.');
            return res.status(503).send();
        }

        const start = Date.now();
        await HealthCheck.create({ datetime: new Date().toISOString() });
        const dbTime = Date.now() - start;
        metrics.timing('db.insert.healthcheck', dbTime);

        logger.info('Health check record inserted successfully.');
        res.status(200)
            .set('Cache-Control', 'no-cache, no-store, must-revalidate')
            .set('Pragma', 'no-cache')
            .send();
    } catch(err) {
        logger.error('Error during health check:', err.stack);
        metrics.increment('api.healthz.failed');
        res.status(503).send();
    }
});

router.post('/file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            metrics.increment('api.upload.failure.no_file');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileId = uuidv4();
        const fileName = req.file.originalname;
        const key = `user-uploads/${fileId}-${fileName}`;

        const s3Start = Date.now();
        let s3_url;
        try {
            s3_url = await uploadFile(req.file, key);
            metrics.increment('s3.upload.success');
        } catch (err) {
            const s3Time = Date.now() - s3Start;
            metrics.timing('s3.upload.time', s3Time);
            metrics.increment('s3.upload.failure');
            logger.error('S3 upload failed:', err.stack);
            return res.status(503).json({ error: 'S3 Upload Failed' });
        }
        const s3Time = Date.now() - s3Start;
        metrics.timing('s3.upload.time', s3Time);

        const dbStart = Date.now();
        try {
            const fileRecord = await File.create({
                id: fileId,
                file_name: fileName,
                s3_url,
                s3_key: key
            });
            const dbTime = Date.now() - dbStart;
            metrics.timing('db.query.create_file', dbTime);
            metrics.increment('db.query.create_file.count');

            return res.status(201).json({
                id: fileRecord.id,
                file_name: fileRecord.file_name,
                url: fileRecord.s3_url,
                upload_date: fileRecord.upload_date
            });
        } catch (err) {
            const dbTime = Date.now() - dbStart;
            metrics.timing('db.query.create_file', dbTime);
            metrics.increment('db.query.create_file.failed');
            logger.error('DB create failed:', err.stack);
            return res.status(503).json({ error: 'DB Error' });
        }
    } catch (err) {
        logger.error('Upload error:', err.stack);
        metrics.increment('api.upload.unexpected_failure');
        res.status(503).json({ error: 'Server Unavailable' });
    }
});

router.get('/file/:id', async (req, res) => {
    try {
        const dbStart = Date.now();
        const file = await File.findByPk(req.params.id);
        const dbTime = Date.now() - dbStart;

        metrics.timing('db.query.find_file_by_id', dbTime);
        metrics.increment('db.query.find_file_by_id.count');

        if (!file) {
            metrics.increment('db.query.find_file_by_id.miss');
            return res.status(404).json({ error: 'File not found' });
        }

        res.json({
            id: file.id,
            file_name: file.file_name,
            url: file.s3_url,
            upload_date: file.upload_date
        });
    } catch (err) {
        logger.error('Get file error:', err.stack);
        metrics.increment('api.get_file.unexpected_failure');
        res.status(503).json({ error: 'Server Unavailable' });
    }
});

router.delete('/file/:id', async (req, res) => {
    try {
        const dbStart = Date.now();
        const file = await File.findByPk(req.params.id);
        const dbTime = Date.now() - dbStart;

        metrics.timing('db.query.find_file_by_id', dbTime);
        metrics.increment('db.query.find_file_by_id.count');

        if (!file) {
            metrics.increment('db.query.find_file_by_id.miss');
            return res.status(404).json({ error: 'File not found' });
        }

        const s3Start = Date.now();
        try {
            await deleteFile(file.s3_key);
            metrics.increment('s3.delete.success');
        } catch (err) {
            const s3Time = Date.now() - s3Start;
            metrics.timing('s3.delete.time', s3Time);
            metrics.increment('s3.delete.failure');
            logger.error('S3 delete failed:', err.stack);
            return res.status(503).json({ error: 'S3 Delete Failed' });
        }
        const s3Time = Date.now() - s3Start;
        metrics.timing('s3.delete.time', s3Time);

        const dbDeleteStart = Date.now();
        await file.destroy();
        const dbDeleteTime = Date.now() - dbDeleteStart;
        metrics.timing('db.query.delete_file', dbDeleteTime);
        metrics.increment('db.query.delete_file.count');

        res.status(204).send();
    } catch (err) {
        logger.error('Delete file error:', err.stack);
        metrics.increment('api.delete_file.unexpected_failure');
        res.status(503).json({ error: 'Server Unavailable' });
    }
});

app.all('/healthz', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.status(405).send();
});

app.get('/v1/file', (req, res) => {
    metrics.increment('api.invalid.get_v1_file');
    res.status(400).json({ error: 'Bad Request' });
});

app.delete('/v1/file', (req, res) => {
    metrics.increment('api.invalid.delete_v1_file');
    res.status(400).json({ error: 'Bad Request' });
});

app.all('/v1/file', (req, res) => {
    metrics.increment(`api.unsupported.${req.method}._v1_file`);
    res.status(405).json({ error: 'Method Not Allowed' });
});

app.all('/v1/file/:id', (req, res) => {
    metrics.increment(`api.unsupported.${req.method}._v1_file_id`);
    res.status(405).json({ error: 'Method Not Allowed' });
});

module.exports = app;


async function retryConnection(){
    let tries = 5;
    while(tries){
        try{
            await sequelize.authenticate();
            logger.info('Database reconnected successfully!!');
            await sequelize.sync({ alter: true });
            logger.info('Models synced to the database after reconnection!');
            return;
        }
        catch(err){
            tries = tries - 1;
            logger.error(`Database connection failed. Retrying... (${tries} attempts left)`);
            await new Promise((resolve) => setTimeout(resolve, 8000));
        }
    }
    if (tries === 0) {
        logger.error('Failed to reconnect to the database after multiple attempts.');
    }
}

function monitorConnection() {
    setInterval(async () => {
        try {
            await sequelize.authenticate();
            logger.info('Database connection is healthy.');
        } catch (err) {
            logger.error('Lost connection to the database. Attempting to reconnect...');
            await retryConnection();
        }
    }, 40000);
}

app.use((err, req, res, next) => {
    logger.error('Unhandled exception:', err.stack);
    res.status(500).send('Something went wrong.');
});

async function start() {
    try{
        await sequelize.authenticate();
        logger.info('Database connected successfully!!');
        await sequelize.sync({ alter: true, logging: console.log });
        logger.info('Models synced to the database!');
        monitorConnection();
        app.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        logger.error('Error starting the server:', err.stack);
    }
}

process.on('SIGINT', async () => {
    await sequelize.close();
    logger.info('Database connection closed successfully!');
    process.exit(0);
});

if (require.main === module) {
    start();
}