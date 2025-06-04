// nodejs_integration_example/src/controllers/recommendationController.js

const recommendationService = require("../services/recommendationService");
const artistRepository = require("../../src/artists/repository");

/**
 * Controller para obter recomendações de artistas para um usuário.
 * Espera receber o ID do usuário como parâmetro de rota (:userId)
 * e opcionalmente o número de recomendações como query param (?n=15).
 */
async function getUserRecommendations(req, res) {
    try {
        // Extrai o ID do usuário dos parâmetros da rota
        const userId = parseInt(req.params.userId, 10);
        console.log(`[Controller] ID do usuário recebido: ${userId}`);
        
        if (isNaN(userId)) {
            return res.status(400).json({ message: "ID de usuário inválido." });
        }

        // Extrai o número de recomendações da query string (opcional)
        const numRecommendationsQuery = req.query.n;
        let numRecommendations;
        if (numRecommendationsQuery) {
            numRecommendations = parseInt(numRecommendationsQuery, 10);
            if (isNaN(numRecommendations) || numRecommendations <= 0) {
                return res.status(400).json({ message: "Número de recomendações inválido." });
            }
        } // Se não for fornecido, o serviço usará o valor padrão

        console.log(`[Controller] Recebida requisição de recomendações para userID: ${userId}, n: ${numRecommendations || 'padrão'}`);

        // Chama o serviço para obter as recomendações
        const recommendations = await recommendationService.getRecommendations(userId, numRecommendations);
        console.log('[Controller] Recomendações obtidas:', recommendations);

        for (const recommendation of recommendations) {
            // Busca detalhes do artista usando o repositório
            const artistDetails = await artistRepository.getArtistById(recommendation.artistID);
            if (artistDetails && artistDetails.rows && artistDetails.rows.length > 0) {
                recommendation.artistDetails = artistDetails.rows[0];
            } else {
                console.warn(`[Controller] Artista não encontrado para ID: ${recommendation.artistID}`);
                recommendation.artistDetails = null;
            }
        }
        

        // Verifica se o serviço retornou uma lista vazia (pode indicar usuário sem vizinhos ou sem novos artistas)
        // O serviço já loga o motivo, aqui apenas retornamos o resultado.
        // if (recommendations.length === 0) {
        //     // Você pode optar por retornar 404 se o usuário não existir no modelo,
        //     // mas o serviço já trata isso internamente. Retornar 200 com lista vazia é comum.
        //     console.log(`[Controller] Nenhuma recomendação encontrada para userID: ${userId}`);
        // }

        // Retorna as recomendações como JSON
        res.status(200).json(recommendations);

    } catch (error) {
        console.error(`[Controller] Erro ao obter recomendações: ${error.message}`);
        // Retorna um erro genérico para o cliente
        // Idealmente, você pode querer mapear erros específicos do serviço para códigos HTTP diferentes
        res.status(500).json({ message: "Erro interno ao processar recomendações.", error: error.message });
    }
}

module.exports = {
    getUserRecommendations,
};

