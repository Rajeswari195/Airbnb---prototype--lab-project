// backend/traveler/src/db/pool.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "mysql",
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || "airbnb_user",
  password: process.env.MYSQL_PASSWORD || "YourStrong#Pass123", // keep same as your MySQL user
  database: "airbnb_app", // 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
