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
    const bookingCollection = db.collection("bookings");

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
    app.get("/tutors", async (req, res) => {
      try {
        const result = await tutorCollection.find().toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // Get most updated featured Tutor data using limit and sort
    app.get("/featured-tutors", async (req, res) => {
      try {
        const result = await tutorCollection
          .aggregate([{ $sort: { _id: -1 } }, { $limit: 6 }])
          .toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    //Get Single tutor details data
    app.get("/tutors/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await tutorCollection.findOne({
          _id: new ObjectId(id),
        });
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // Post Booking data
    app.post("/bookings", async (req, res) => {
      try {
        const bookingsData = req.body;
        const tutorId = bookingsData.tutorId;

        // find tutor details from db
        const tutor = await tutorCollection.findOne({
          _id: new ObjectId(tutorId),
        });
        if (!tutor) {
          return res.status(404).json({ message: "Tutor not found" });
        }

        // session date restrictions
        const currentDate = new Date();
        const sessionDate = new Date(tutor.startDate);

        // accurate day comparison
        currentDate.setHours(0, 0, 0, 0);
        sessionDate.setHours(0, 0, 0, 0);

        if (currentDate < sessionDate) {
          return res
            .status(400)
            .json({ message: "Booking is not available yet for this tutor" });
        }

        // validate available slots
        const currentSlotNum = parseInt(tutor.totalSlot);
        if (isNaN(currentSlotNum) || currentSlotNum <= 0) {
          return res
            .status(400)
            .json({
              message:
                "This session is fully booked. You can’t join at the moment.",
            });
        }

        // save booking record to the db
        const result = await bookingCollection.insertOne(bookingsData);

        // automatically decrease available slot count
        if (result.insertedId) {

          const newSlotValue = (currentSlotNum - 1).toString();

          await tutorCollection.updateOne(
            { _id: new ObjectId(tutorId) },
            { $set: { totalSlot: newSlotValue } },
          );
        }

        res.json({ message: "Booking successful", result });
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

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
