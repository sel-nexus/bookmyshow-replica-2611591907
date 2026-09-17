import { createApp } from './app';
import { loadConfig } from './config';
import { openDatabase } from './db/database';
/** Start the configured API listener. */
const config=loadConfig();
createApp(openDatabase(config.sqlitePath),config).listen(config.port,()=>console.log(`API listening on ${config.port}`));