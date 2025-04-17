const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const { processCalculation } = require("../controllers/calculateController");

const router = express.Router();

router.post("/", upload.single("file"), processCalculation);

module.exports = router;