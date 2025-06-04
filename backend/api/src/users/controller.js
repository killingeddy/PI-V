const repository = require("./repository");
const bcrypt = require("bcryptjs");

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

  if (!userId || !artistsId || !Array.isArray(artistsId)) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    for (const artistId of artistsId) {
      await repository.addUserPreference(userId, artistId);
    }
    res.status(201).json({ message: "Preferências adicionadas com sucesso" });
  } catch (error) {
    console.error("Erro ao adicionar preferências:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

module.exports = {
  addNewUser,
  loginUser,
  addUserPreference,
};
