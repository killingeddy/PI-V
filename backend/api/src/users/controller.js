const repository = require("./repository");
const { spawn } = require("child_process");
const bcrypt = require("bcryptjs");
const path = require("path");

const PYTHON_EXECUTABLE_RETRAIN = "python";
const PYTHON_TRAIN_SCRIPT_PATH = path.join(__dirname, "..", "..", "..", "train_and_save_model.py");

async function triggerModelRetraining() {
  console.log("[Retrain Trigger] Iniciando o script de retreinamento em segundo plano...");
  console.log(`[Retrain Trigger] Script: ${PYTHON_TRAIN_SCRIPT_PATH}`);

  const pythonProcess = spawn(PYTHON_EXECUTABLE_RETRAIN, [PYTHON_TRAIN_SCRIPT_PATH], {
    detached: true,
    stdio: "ignore",
  });

  pythonProcess.unref(); 

  pythonProcess.on("error", (error) => {
    console.error(`[Retrain Trigger] Erro ao iniciar o script de retreinamento: ${error.message}`);
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`[Retrain Trigger] Script de retreinamento finalizou com erro (código ${code}).`);
    } else {
      console.log("[Retrain Trigger] Script de retreinamento finalizado com sucesso (em segundo plano).");
    }
  });
}

const addNewUser = async (req, res) => {
  const { name, username, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    const existingUser = await repository.getUserByUsername(username);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await repository.addNewUser({
      name,
      username,
      password: hashedPassword,
    });

    // triggerModelRetraining();

    res.status(201).json({ id: newUser.rows[0].id });
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
  }

  try {
    const user = await repository.getUserByUsername(username);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.rows[0].password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Usuário ou senha inválidos" });
    }

    res.status(200).json({ id: user.rows[0].id, name: user.rows[0].name });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const addUserPreference = async (req, res) => {
  const { user_id } = req.params;
  const { artistsId } = req.body;
  const userId = parseInt(user_id, 10);
  const defaultWeight = 260;

  if (!userId || !artistsId || !Array.isArray(artistsId) || artistsId.length === 0) {
    return res.status(400).json({ error: "Dados inválidos ou lista de artistas vazia" });
  }

  try {
    for (const artistId of artistsId) {
      if (typeof artistId !== 'number' || artistId <= 0) {
         console.warn(`[addUserPreference] ID de artista inválido ignorado: ${artistId}`);
         continue;
      }
      await repository.addUserPreference(userId, artistId, defaultWeight);
    }

    await triggerModelRetraining(); 

    res.status(201).json({ message: "Preferências adicionadas e retreinamento iniciado em segundo plano." });

  } catch (error) {
    console.error("Erro ao adicionar preferências:", error);
    if (error.code === '23503') {
        return res.status(404).json({ error: "Usuário ou um dos artistas não encontrado." });
    }
    if (error.code === '23505') {
        console.warn(`[addUserPreference] Tentativa de adicionar preferência duplicada ignorada: ${error.detail}`);
    } else {
        res.status(500).json({ error: "Erro interno ao salvar preferências." });
    }
  }
};

module.exports = {
  addNewUser,
  loginUser,
  addUserPreference,
};
