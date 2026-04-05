const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MySQL (no password)
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "honey",   // no password
  database: "Harini_portfolio"
  
});

db.connect(err => {
  if (err) console.log("DB Error:", err);
  else console.log("MySQL Connected");
});

// Store data
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  const sql = "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)";

  db.query(sql, [name, email, message], (err) => {
    if (err) return res.status(500).send("Error");
    res.send("Saved");
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
