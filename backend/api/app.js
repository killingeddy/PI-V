const bodyParser = require("body-parser");
const router = require("./router");
const express = require("express");
const cors = require("cors");
require('dotenv').config();
const app = express();

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());
app.use(router);

app.listen(process.env.PORT, () => {
    console.log('_____Start_____')
    console.log(`http://localhost:${process.env.PORT}`)
});