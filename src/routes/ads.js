const express = require("express");
const router = express.Router();

const adController = require("../controllers/adController");

router.get("/ads", adController.index);
router.get("/ads/new", adController.new);
router.post("/ads/create", adController.create);
router.post("/ads/:id/destroy", adController.destroy);
router.get("/ads/:id/edit", adController.edit);
router.post("/ads/:id/update", adController.update);
router.get("/ads/:id", adController.show);

module.exports = router;