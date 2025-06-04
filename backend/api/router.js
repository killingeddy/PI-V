const recommendationController = require("./ia_src/controllers/recommendationController");
const artistsController = require("./src/artists/controller");
const usersController = require("./src/users/controller");
const express = require("express");
const router = express.Router();

// Define rotas para as recomendações de artistas
router.get(
  "/users/:userId/recommendations",
  recommendationController.getUserRecommendations
);

// Define rotas para os artistas
router.get("/artists", artistsController.getAllArtists);
router.get("/artists/:id", artistsController.getArtistById);

// Define rotas para os usuários
router.post("/users", usersController.addNewUser);
router.post("/users/login", usersController.loginUser);
router.post("/users/preferences/:user_id", usersController.addUserPreference);

module.exports = router;
