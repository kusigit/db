'use strict';

const { logInfo, logError } = require('logger');
const mariadb = require('mariadb');

let pool = null;

const config = {
  host: process.env.MARIADB_SERVICE_HOST || 'localhost',
  port: process.env.MARIADB_SERVICE_PORT || 3306,
  user: process.env.MARIADB_USER || 'root',
  password: process.env.MARIADB_PASSWORD || 'root',
  database: process.env.MARIADB_NAME || 'omnimanager',
};

const getConnection = async (withPool = false) => {
  let conn = null;

  if (withPool) {
    if (!pool) {
      logInfo('create pool');
      pool = mariadb.createPool(config);
    }

    logInfo('get connection from pool');
    conn = await pool.getConnection();
  } else {
    logInfo('create connection');
    conn = await mariadb.createConnection(config);
  }

  return {
    query: (sql, bind) => {
      logInfo(sql, bind);
      return conn.query(sql, bind);
    },
    end: () => {
      logInfo('connection end');
      return conn.end();
    },
  };
};

const handler = (getData) => async (req, res) => {
  let conn = null;
  try {
    conn = await getConnection(true);
    const data = await getData(conn, req, res);
    res.send(data || { state: 'ok' });
  } catch (err) {
    await logError(err.message);
    res.status(500).send(err);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

module.exports = {
  getConnection,
  handler,
};
