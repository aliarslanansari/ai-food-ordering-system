import fs from "fs";
import axios from "axios";
import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

const foods = JSON.parse(fs.readFileSync("./../data/foods.json", "utf-8"));

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function fileExists(fileName) {
  const result = await imagekit.listFiles({
    searchQuery: `name="${fileName}" AND path="/ai-food-ordering-system/dishes/"`,
  });

  return result.length > 0;
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

async function searchImage(food) {
  const response = await axios.get("https://api.pexels.com/v1/search", {
    headers: { Authorization: PEXELS_API_KEY },
    params: {
      query: `food dish ${food.name} description: ${food.description}`,
      per_page: 1,
    },
  });

  if (!response.data.photos.length) return null;

  return response.data.photos[0].src.large;
}

async function uploadImageFromUrl(url, fileName) {
  return imagekit.upload({
    file: url,
    fileName,
    folder: "/ai-food-ordering-system/dishes",
    useUniqueFileName: false,
  });
}

async function run() {
  for (const food of foods) {
    const fileName = `${food.id}.png`;

    try {
      console.log(`Checking ${fileName}...`);

      const exists = await fileExists(fileName);

      if (exists) {
        console.log("✔ Already exists — skipping");
        continue;
      }

      console.log("🔍 Searching image...");
      const imageUrl = await searchImage(food);

      if (!imageUrl) {
        console.log("⚠ No image found");
        continue;
      }

      console.log("⬆ Uploading...");
      await uploadImageFromUrl(imageUrl, fileName);

      console.log("✅ Uploaded successfully\n");

      // Basic rate limiting
      await new Promise((res) => setTimeout(res, 1000));
    } catch (err) {
      console.error(`❌ Error for ${food.name}:`, err.message);
    }
  }

  console.log("Done.");
}

run();
