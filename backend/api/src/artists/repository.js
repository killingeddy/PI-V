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

const getAllArtists = async (search, limit = 10, offset = 0) => {
  let whereClause = "";
  if (search) {
    whereClause = `WHERE a.name ILIKE '%${search}%'`;
  }
  const query = {
    text: `SELECT
      a.*,
      COUNT(DISTINCT ua."userID") AS popularity
    FROM artists a
    LEFT JOIN user_artists ua
	    ON ua."artistID" = a.id
    ${whereClause}
    GROUP BY a.id
    ORDER BY popularity DESC
    LIMIT $1 OFFSET $2`,
    values: [limit, offset],
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
