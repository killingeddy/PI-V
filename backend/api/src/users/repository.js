const pool = require("../../config/db");

const queryExec = async (dataQuery) => {
  const client = await pool.connect();
  try {
    const dataResult = await client.query(dataQuery);

    return { rows: dataResult.rows };
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
};

const addNewUser = async (userData) => {
  const query = {
    text: `INSERT INTO users (name, username, password)
    VALUES ($1, $2, $3)
    RETURNING id`,
    values: [userData.name, userData.username, userData.password],
  };
  try {
    return await queryExec(query);
  } catch (error) {
    throw error;
  }
};

const getUserById = async (id) => {
  const query = {
    text: "SELECT * FROM users WHERE id = $1",
    values: [id],
  };

  try {
    return await queryExec(query);
  } catch (error) {
    throw error;
  }
};

const getUserByUsername = async (username) => {
  const query = {
    text: "SELECT * FROM users WHERE username = $1",
    values: [username],
  };

  try {
    return await queryExec(query);
  } catch (error) {
    throw error;
  }
};

const addUserPreference = async (userId, artistId) => {
  const query = {
    text: `INSERT INTO user_artists ("userID", "artistID", weight)
    VALUES ($1, $2, 260)`,
    values: [userId, artistId],
  };
  try {
    return await queryExec(query);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  addNewUser,
  getUserById,
  getUserByUsername,
  addUserPreference,
};
