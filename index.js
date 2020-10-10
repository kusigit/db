'use strict';

const {logInfo, logError} = require('logger');
let pool = null;

const getConnection = async () => {
  if (!pool) {
    const mariadb = require('mariadb');

    pool = mariadb.createPool({
      host: process.env.MARIADB_SERVICE_HOST || 'localhost',
      port: process.env.MARIADB_SERVICE_PORT || 3306,
      user: process.env.MARIADB_USER || 'root',
      password: process.env.MARIADB_PASSWORD || 'root',
      database: process.env.MARIADB_NAME || 'omnimanager',
    });
  }
  logInfo('connect');
  const conn = await pool.getConnection();
  return {
    query: (sql, bind) => {
      logInfo(sql, bind);
      return conn.query(sql, bind);
    },
    end: () => {
      logInfo('end');
      return conn.end();
    },
  };
};

const handler = (getData) => async (req, res) => {
  let conn = null;
  try {
    conn = await getConnection();
    const data = await getData(conn, req, res);
    res.send(data || {state: 'ok'});
  } catch (err) {
    await logError(err.message);
    res.status(500).send(err);
  } finally {
    if (conn) {
      conn.end();
    }
  }
};

module.exports = {
  getConnection: getConnection,
  handler: handler,
};
