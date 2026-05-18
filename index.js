const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
// dotenv config
dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8008;

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("mediqueue");
    const tutorCollection = db.collection("tutors");

    // api's

    // Post Tutor to DB
    app.post("/tutors", async (req, res) => {
      try {
        const tutorsData = req.body;
        const result = await tutorCollection.insertOne(tutorsData);
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // Get This Tutor Data
    app.get("/tutors", async(req, res) => {
      try {
        const result = await tutorCollection.find().toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Ping pong. Server successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Medique Server is running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
