import express, { query } from "express";
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
app.get("/", async (req, res) => {
  try {
    const categoryResult = await client.query("SELECT * FROM categories_tb");
    const combined_res = await client.query(
      `SELECT url_tb.*, categories_tb.category
      FROM url_tb
      INNER JOIN url_categories_tb ON url_tb.id = url_categories_tb.url_id
      INNER JOIN categories_tb ON categories_tb.id = url_categories_tb.category_id`
    );
    let combinedArray = [];
    combined_res.rows.forEach((value) => {
      const present = combinedArray.find((i) => i.id === value.id);
      if (present) {
        present.category.push(value.category);
      } else {
        combinedArray.push({ ...value, category: [value.category] });
      }
    });
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
    for (const cat of categories) {
      const categoryResult = await client.query(
        "SELECT id FROM categories_tb WHERE category = $1",
        [cat]
      );

      let categoryId;
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      } else {
        const newCategoryResult = await client.query(
          "INSERT INTO categories_tb (category) VALUES($1) RETURNING id",
          [cat]
        );
        categoryId = newCategoryResult.rows[0].id;
      }
      await client.query(
        "INSERT INTO url_categories_tb (url_id, category_id) VALUES($1, $2)",
        [urlId, categoryId]
      );
    }
    const hey = await client.query(
      `
      SELECT url_tb.*, categories_tb.category
      FROM url_tb
      INNER JOIN url_categories_tb ON url_categories_tb.url_id = url_tb.id
      INNER JOIN categories_tb ON categories_tb.id = url_categories_tb.category_id
      WHERE url_categories_tb.url_id = $1;
      `,
      [urlId]
    );
    let combinedArray = [];
    hey.rows.forEach((value) => {
      const present = combinedArray.find((i) => i.id === value.id);
      if (present) {
        present.category.push(value.category);
      } else {
        combinedArray.push({ ...value, category: [value.category] });
      }
    });
    const data = {
      combinedArray: combinedArray[0],
      hey: hey.rows,
      url: urlResult.rows[0],
      categories: categories,
    };
    res.status(200).json(data);
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
    await client.query("DELETE FROM url_categories_tb WHERE url_id = $1", [
      index,
    ]);
    for (const cat of categories) {
      const categoryResult = await client.query(
        "SELECT id FROM categories_tb WHERE category = $1",
        [cat]
      );

      let categoryId;
      if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
      } else {
        const newCategoryResult = await client.query(
          "INSERT INTO categories_tb (category) VALUES($1) RETURNING id",
          [cat]
        );
        categoryId = newCategoryResult.rows[0].id;
      }
      await client.query(
        "INSERT INTO url_categories_tb (url_id, category_id) VALUES($1, $2)",
        [index, categoryId]
      );
    }
    console.log(result.rows);
    if (result.rowCount > 0) {
      res.status(200).json({
        updated: result.rows[0],
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
