// nodejs_integration_example/src/services/recommendationService.js

const { spawn } = require("child_process");
const path = require("path");

// --- Configurações ---
// Caminho para o executável do Python (ajuste se necessário)
// Pode ser python, python3, python3.11 dependendo do seu ambiente
const PYTHON_EXECUTABLE = "python3.11"; 

// Caminho para o script Python de recomendação
// Assume que a pasta nodejs_integration_example está no mesmo nível que recommend_from_saved.py
const PYTHON_SCRIPT_PATH = path.join(__dirname, "..", "..", "..", "recommend_from_saved.py");

// Número padrão de recomendações
const DEFAULT_N_RECOMMENDATIONS = 10;

/**
 * Chama o script Python para obter recomendações de artistas para um usuário.
 * 
 * @param {number} userId O ID do usuário para o qual gerar recomendações.
 * @param {number} [numRecommendations=DEFAULT_N_RECOMMENDATIONS] O número de recomendações desejadas.
 * @returns {Promise<Array<{artistID: number, score: number}>>} Uma Promise que resolve com a lista de recomendações 
 *                                                              ou rejeita com um erro.
 */
async function getRecommendations(userId, numRecommendations = DEFAULT_N_RECOMMENDATIONS) {
    console.log(`[Service] Solicitando ${numRecommendations} recomendações para userID: ${userId}`);
    console.log(`[Service] Executando script: ${PYTHON_SCRIPT_PATH}`);

    return new Promise((resolve, reject) => {
        // Argumentos para o script Python: [script_path, user_id, -n, num_recommendations]
        const args = [
            PYTHON_SCRIPT_PATH,
            userId.toString(), // Argumentos devem ser strings
            "-n",
            numRecommendations.toString()
        ];

        // Spawna o processo Python
        const pythonProcess = spawn(PYTHON_EXECUTABLE, args);

        let jsonData = "";
        let errorData = "";

        // Captura a saída padrão (stdout) - esperamos o JSON aqui
        pythonProcess.stdout.on("data", (data) => {
            jsonData += data.toString();
        });

        // Captura a saída de erro (stderr) - para logs e depuração
        pythonProcess.stderr.on("data", (data) => {
            errorData += data.toString();
            console.error(`[Python stderr] ${data}`); // Log do erro do Python
        });

        // Evento de erro ao tentar iniciar o processo
        pythonProcess.on("error", (error) => {
            console.error(`[Service] Erro ao iniciar o processo Python: ${error.message}`);
            reject(new Error(`Falha ao iniciar o script de recomendação: ${error.message}`));
        });

        // Evento de fechamento do processo
        pythonProcess.on("close", (code) => {
            console.log(`[Service] Processo Python finalizado com código: ${code}`);
            
            if (code !== 0) {
                console.error(`[Service] Script Python terminou com erro (código ${code}). Saída de erro: ${errorData}`);
                return reject(new Error(`Script de recomendação falhou (código ${code}). Detalhes no log.`));
            }

            try {
                // Tenta encontrar o JSON na saída
                // O script Python imprime logs antes do JSON, então precisamos extrair o JSON
                const jsonOutputMatch = jsonData.match(/\n---\sJSON\sOutput\s---\s*\n(\[.*\])/s);
                
                if (jsonOutputMatch && jsonOutputMatch[1]) {
                    const recommendations = JSON.parse(jsonOutputMatch[1]);
                    console.log(`[Service] Recomendações recebidas: ${recommendations.length} itens.`);
                    resolve(recommendations);
                } else {
                    console.error("[Service] Não foi possível encontrar ou parsear o JSON na saída do Python.");
                    console.error("[Service] Saída completa do stdout:", jsonData); 
                    reject(new Error("Formato de resposta inválido do script de recomendação."));
                }
            } catch (parseError) {
                console.error(`[Service] Erro ao parsear JSON da saída do Python: ${parseError}`);
                console.error("[Service] Saída completa do stdout:", jsonData); 
                reject(new Error("Erro ao processar a resposta do script de recomendação."));
            }
        });
    });
}

module.exports = {
    getRecommendations,
};

