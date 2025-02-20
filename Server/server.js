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
app.get("/url", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM url_tb");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error occured");
    res.status(500).send("Error while sending");
  }
});
app.post("/url/:input", async (req, res) => {
  const hey = req.params.input;
  try {
    const result = await client.query(
      "INSERT INTO url_tb (url) VALUES($1) RETURNING *",
      [hey]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding URL");
    res.status(500).send("Error inserting URL into database");
  }
});

app.delete("/:index", async (req, res) => {
  const hey = req.params.index;
  const index = Number(hey);
  try {
    await client.query("DELETE FROM url_tb WHERE id=$1", [index]);
    res.status(200).send("Url deleted");
  } catch (error) {
    console.error("Error deleting URL:");
    res.status(500).send("Error deleting URL into database");
  }
});

app.post("/edit/:index", async (req, res) => {
  const hey = req.params.index;
  const index = Number(hey);
  const body = req.body;
  try {
    await client.query("UPDATE url_tb SET url=$1 WHERE id=$2", [body, index]);
    res.status(200).send("Url edited");
  } catch (error) {
    console.error("Error ocuucred while editing");
    res.status(500).send("Error editing URL into database");
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
