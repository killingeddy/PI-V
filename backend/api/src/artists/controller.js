const repository = require("./repository");

const getAllArtists = async (req, res) => {
  try {
    const {search, limit, offset} = req.query;

    let limitValue = parseInt(limit, 10) || 10;
    let offsetValue = parseInt(offset, 10) || 0;

    const artists = await repository.getAllArtists(search, limitValue, offsetValue);
    res.status(200).json(artists);
  } catch (error) {
    console.error("Error fetching artists:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getArtistById = async (req, res) => {
  try {
    const artistId = parseInt(req.params.id, 10);
    if (isNaN(artistId)) {
      return res.status(400).json({ error: "Invalid artist ID" });
    }

    const artist = await repository.getArtistById(artistId);
    if (artist.rows.length === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }

    res.status(200).json(artist.rows[0]);
  } catch (error) {
    console.error("Error fetching artist:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllArtists,
  getArtistById
};
