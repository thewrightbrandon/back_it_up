const { connectToDatabase } = require('../../src/database/databaseConnection');
const { pool } = require('../../config/databaseConfig');

jest.mock('../../config/databaseConfig', () => ({
    pool: {
        connect: jest.fn(),
        options: {
            database: 'test_db',
        }
    }
}));

describe('connectToDatabase', () => {
    it('should log success when the database connection is successful', async () => {

        pool.connect.mockResolvedValueOnce(true);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await connectToDatabase();

        expect(logSpy).toHaveBeenCalledWith('Attempting to connect to the database...');
        expect(logSpy).toHaveBeenCalledWith('Successfully connected to the "test_db" database!');

        logSpy.mockRestore();
    });

    it('should log error when the database connection fails', async () => {

        pool.connect.mockRejectedValueOnce(new Error('Connection failed'));

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await connectToDatabase();

        expect(errorSpy).toHaveBeenCalledWith('Error connecting to database.', expect.any(Error));

        errorSpy.mockRestore();
    });
});
