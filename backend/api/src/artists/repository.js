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

const getAllArtists = async () => {
  const query = {
    text: "SELECT * FROM artists",
  };

  try {
    return await queryExec(query);
  } catch (error) {
    throw error;
  }
};

const getArtistById = async (id) => {
  const query = {
    text: "SELECT * FROM artists WHERE id = $1",
    values: [id],
  };

  try {
    return await queryExec(query);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllArtists,
  getArtistById,
};
