const recommendationService = require("../services/recommendationService");
const artistRepository = require("../../src/artists/repository");

async function getUserRecommendations(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    console.log(`[Controller] ID do usuário recebido: ${userId}`);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "ID de usuário inválido." });
    }

    const numRecommendationsQuery = req.query.n;
    let numRecommendations;
    if (numRecommendationsQuery) {
      numRecommendations = parseInt(numRecommendationsQuery, 10);
      if (isNaN(numRecommendations) || numRecommendations <= 0) {
        return res
          .status(400)
          .json({ message: "Número de recomendações inválido." });
      }
    }

    console.log(
      `[Controller] Recebida requisição de recomendações para userID: ${userId}, n: ${
        numRecommendations || "padrão"
      }`
    );

    const recommendations = await recommendationService.getRecommendations(
      userId,
      numRecommendations
    );
    console.log("[Controller] Recomendações obtidas:", recommendations);

    for (const recommendation of recommendations) {
      const artistDetails = await artistRepository.getArtistById(
        recommendation.artistID
      );
      if (
        artistDetails &&
        artistDetails.rows &&
        artistDetails.rows.length > 0
      ) {
        recommendation.artistDetails = artistDetails.rows[0];
      } else {
        console.warn(
          `[Controller] Artista não encontrado para ID: ${recommendation.artistID}`
        );
        recommendation.artistDetails = null;
      }
    }

    res.status(200).json(recommendations);
  } catch (error) {
    console.error(`[Controller] Erro ao obter recomendações: ${error.message}`);
    res
      .status(500)
      .json({
        message: "Erro interno ao processar recomendações.",
        error: error.message,
      });
  }
}

module.exports = {
  getUserRecommendations,
};
