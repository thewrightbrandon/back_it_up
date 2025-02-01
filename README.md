# Backup Tool CLI

## Overview
The Backup Tool CLI is a command-line application for managing incremental file snapshots and restoring them efficiently. It provides functionality for:

- Taking incremental snapshots of files.
- Restoring files from previous snapshots.
- Pruning outdated snapshots to save storage.

## Features
- **Incremental Backups**: Only stores new or modified files.
- **File Integrity Checks**: Uses hashing to detect file changes.
- **Snapshot Management**: List, prune by ID or Timestamp, and restore snapshots.
- **Directory Restoration**: Recreates original file structure when restoring.
- **Error Handling**:Gracefully handles missing directories and invalid snapshot IDs.
- **Automatic Directory Handling**: Ensures directories exist before performing operations.
- **Database Integration**: Uses PostgreSQL to track file changes.
- **Docker Support**: Easily run the tool in a containerized environment.

## Installation
### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/) (optional)

### Setup
1. Clone the repository:
   ```sh
   git clone <repository_url>
   cd back_it_up
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up the database:
   ```sh
   cp .env.example .env
   # Edit .env with database credentials
   npm run migrate  # Apply database migrations
   ```

## Usage
```sh
npm start
```

## Testing
To run tests using Jest:
```sh
npm test
```

## Future Enhancements
- **Enhanced Error Handling**: More robust error messages and structured logging.
- **Detailed Logs & Reporting**: Enhance logging and include reporting features.
- **Compression Support**: Store snapshots in compressed format to save space.
- **Parallel Processing**: Optimize file operations for performance.
- **S3/Cloud Storage Integration**: Store snapshots in cloud storage.
- **Encryption Support**: Secure snapshots with encryption.

## Improvements
- Get further in Docker implementation
- Add more unit tests & attempt integration tests 
