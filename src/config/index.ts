export const config = {
    nodeEnv: process.env.NODE_ENV,
    server: {
        host: process.env.HOST,
        port: process.env.PORT,
    },
    logger: {
        enableLogs: JSON.parse(process.env.LOGGER_ENABLE_LOGS || 'true'),
        storeLogs: JSON.parse(process.env.LOGGER_STORE_LOGS || 'false'),
        dateTimeFormat: process.env.LOGGER_DATE_TIME_FORMAT || 'YYYY-MM-DD [at] HH:mm:ss',
    },
    models: {
        llm: {
            baseUrl: process.env.LLM_BASE_URL,
            apiKey: process.env.LLM_API_KEY,
            googleAuthJsonPath: process.env.GOOGLE_AUTH_JSON_PATH,
        }
    }
}