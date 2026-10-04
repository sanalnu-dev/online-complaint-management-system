const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = parseInt(process.env.PORT, 10) || 5001;

async function startServer() {
  try {
    const dbStatus = await testConnection();
    if (!dbStatus.ok) {
      console.error('[Database Error] Failed to connect to MySQL:', dbStatus.error);
      process.exit(1);
    }
    console.log('[Database] Connected to MySQL successfully (ocms_db)');

    app.listen(PORT, () => {
      console.log(`[Server] OCMS Backend running at http://localhost:${PORT}`);
      console.log(`[Server] API Health check at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server Error] Startup failure:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
