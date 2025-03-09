import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import pkg from "pg";
const { Client } = pkg;
const app = express();
const server = createServer(app);
const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "url_db",
  password: "lollipop",
  port: 5432,
});

client
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err.stack));

app.use(cors());
app.use(express.json());
app.use(express.text());
async function getOrInsertCategory(categoryName) {
  const categoryResult = await client.query(
    "SELECT id FROM categories_tb WHERE category=$1",
    [categoryName]
  );

  if (categoryResult.rowCount > 0) {
    return categoryResult.rows[0].id;
  } else {
    const newCategory = await client.query(
      "INSERT INTO categories_tb (category) VALUES($1) RETURNING id",
      [categoryName]
    );
    return newCategory.rows[0].id;
  }
}

async function insertOrUpdateUrlWithCategories(urlId, categories) {
  await client.query("DELETE FROM url_categories_tb WHERE url_id = $1", [
    urlId,
  ]);
  for (const category of categories) {
    const categoryId = await getOrInsertCategory(category);
    await client.query(
      "INSERT INTO url_categories_tb (url_id, category_id) VALUES($1, $2)",
      [urlId, categoryId]
    );
  }
}

async function getCombinedUrlData(urlId) {
  const combined_res = await client.query(
    `
    SELECT url_tb.*, categories_tb.category
    FROM url_tb
    INNER JOIN url_categories_tb ON url_tb.id = url_categories_tb.url_id
    INNER JOIN categories_tb ON categories_tb.id = url_categories_tb.category_id
    WHERE url_categories_tb.url_id = $1;
    `,
    [urlId]
  );

  let mapArray = new Map();
  combined_res.rows.forEach((value) => {
    if (mapArray.has(value.id)) {
      mapArray.get(value.id).category.push(value.category);
    } else {
      mapArray.set(value.id, { ...value, category: [value.category] });
    }
  });
  return Array.from(mapArray.values())[0];
}

function combineUrlAndCategoryData(rows) {
  let mapArray = new Map();

  rows.forEach((value) => {
    if (mapArray.has(value.id)) {
      mapArray.get(value.id).category.push(value.category);
    } else {
      mapArray.set(value.id, { ...value, category: [value.category] });
    }
  });

  return Array.from(mapArray.values());
}

app.get("/", async (req, res) => {
  try {
    const categoryResult = await client.query("SELECT * FROM categories_tb");
    const combined_res = await client.query(
      `SELECT url_tb.*, categories_tb.category
      FROM url_tb
      INNER JOIN url_categories_tb ON url_tb.id = url_categories_tb.url_id
      INNER JOIN categories_tb ON categories_tb.id = url_categories_tb.category_id`
    );
    const combinedArray = combineUrlAndCategoryData(combined_res.rows);
    const data = {
      catRes: categoryResult.rows,
      combinedArray: combinedArray,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error("Error occurred while fetching URLs:", error);
    res.status(500).send("Error while sending data");
  }
});

app.post("/url", async (req, res) => {
  const { url, category } = req.body;
  const categories = Array.isArray(category) ? category : [category];

  try {
    const urlResult = await client.query(
      "INSERT INTO url_tb (url) VALUES($1) RETURNING *",
      [url]
    );
    const urlId = urlResult.rows[0].id;
    await insertOrUpdateUrlWithCategories(urlId, categories);

    const combinedData = await getCombinedUrlData(urlId);
    res.status(200).json({
      combinedArray: combinedData,
      categories,
    });
  } catch (error) {
    console.error("Error adding URL:", error);
    res.status(500).send("Error inserting URL into database");
  }
});

app.delete("/:index", async (req, res) => {
  const index = Number(req.params.index);
  try {
    await client.query("DELETE FROM url_categories_tb WHERE url_id = $1", [
      index,
    ]);
    await client.query("DELETE FROM url_tb WHERE id=$1", [index]);
    res.status(200).json({ message: "URL deleted successfully" });
  } catch (error) {
    console.error("Error deleting URL:", error);
    res.status(500).send("Error deleting URL from database");
  }
});

app.post("/edit/:index", async (req, res) => {
  const index = Number(req.params.index);
  const { url, category } = req.body;
  const categories = Array.isArray(category) ? category : [category];
  try {
    const result = await client.query(
      "UPDATE url_tb SET url=$1 WHERE id=$2 RETURNING *",
      [url, index]
    );

    if (result.rowCount > 0) {
      await insertOrUpdateUrlWithCategories(index, categories);
      const updatedData = await getCombinedUrlData(index);
      res.status(200).json({
        updated: updatedData,
      });
    } else {
      res.status(404).send("URL not found");
    }
  } catch (error) {
    console.error("Error occurred while editing URL:", error);
    res.status(500).send("Error editing URL in database");
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
