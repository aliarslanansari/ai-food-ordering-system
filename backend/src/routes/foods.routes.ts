import { Router } from "express";
import { getFoods } from "../services/data.service.js";

const router = Router();

// GET /api/foods - Get all foods
router.get("/", (_req, res) => {
  try {
    const foods = getFoods();
    res.json({
      success: true,
      data: foods,
      count: foods.length,
    });
  } catch (error) {
    console.error("Error fetching foods:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch foods",
    });
  }
});

export default router;
