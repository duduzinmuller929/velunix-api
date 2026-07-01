import app from './app.js';

app.listen({ port: 8000 }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    app.log.info(`Server is running on ${address}`);
});
