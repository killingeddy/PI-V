const { spawn } = require("child_process");
const path = require("path");

const PYTHON_EXECUTABLE = "python3";
const PYTHON_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "recommend_from_saved_v3_fixed.py"
);

const DEFAULT_N_RECOMMENDATIONS = 10;

/**
 *
 * @param {number} userId
 * @param {number} [numRecommendations=DEFAULT_N_RECOMMENDATIONS]
 * @returns {Promise<Array<{artistID: number, score: number}>>}
 *
 */
async function getRecommendations(
  userId,
  numRecommendations = DEFAULT_N_RECOMMENDATIONS
) {
  console.log(
    `[Service] Solicitando ${numRecommendations} recomendações para userID: ${userId}`
  );
  console.log(
    `[Service] Executando script: ${PYTHON_SCRIPT_PATH} com ${PYTHON_EXECUTABLE}`
  );

  return new Promise((resolve, reject) => {
    const args = [
      PYTHON_SCRIPT_PATH,
      userId.toString(),
      "-n",
      numRecommendations.toString(),
    ];

    const pythonProcess = spawn(PYTHON_EXECUTABLE, args);

    let jsonData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      jsonData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
      console.error(`[Python stderr] ${data}`);
    });

    pythonProcess.on("error", (error) => {
      console.error(
        `[Service] Erro ao iniciar o processo Python: ${error.message}`
      );
      reject(
        new Error(`Falha ao iniciar o script de recomendação: ${error.message}`)
      );
    });

    pythonProcess.on("close", (code) => {
      console.log(`[Service] Processo Python finalizado com código: ${code}`);

      if (code !== 0) {
        console.error(
          `[Service] Script Python terminou com erro (código ${code}). Saída de erro: ${errorData}`
        );
        return reject(
          new Error(
            `Script de recomendação falhou (código ${code}). Detalhes no log.`
          )
        );
      }

      try {
        const jsonOutputMatch = jsonData.match(
          /\n---\sJSON\sOutput\s---\s*\n(\[.*\])/s
        );

        if (jsonOutputMatch && jsonOutputMatch[1]) {
          const recommendations = JSON.parse(jsonOutputMatch[1]);
          console.log(
            `[Service] Recomendações recebidas: ${recommendations.length} itens.`
          );
          resolve(recommendations);
        } else {
          console.error(
            "[Service] Não foi possível encontrar ou parsear o JSON na saída do Python."
          );
          console.error("[Service] Saída completa do stdout:", jsonData);
          reject(
            new Error("Formato de resposta inválido do script de recomendação.")
          );
        }
      } catch (parseError) {
        console.error(
          `[Service] Erro ao parsear JSON da saída do Python: ${parseError}`
        );
        console.error("[Service] Saída completa do stdout:", jsonData);
        reject(
          new Error("Erro ao processar a resposta do script de recomendação.")
        );
      }
    });
  });
}

module.exports = {
  getRecommendations,
};
