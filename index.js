const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createRemoteJWKSet, jwtVerify } = require("jose-node-cjs-runtime");
// dotenv config
dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 8008;

app.get("/", (req, res) => {
  res.send("Medique Server is running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


//jwks

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

//middleware

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);

    console.log(payload);

    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    // await client.connect();
    const db = client.db("mediqueue");
    const tutorCollection = db.collection("tutors");
    const bookingCollection = db.collection("bookings");

    // api's

    // post tutor to DB
    app.post("/tutors", async (req, res) => {
      try {
        const tutorsData = req.body;
        const result = await tutorCollection.insertOne(tutorsData);
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // Get TUTORS data with search & date filter
    app.get("/tutors", async (req, res) => {
      try {
        // receieve data of frontend with req.query
        const { search, startDate, endDate } = req.query;

        // normally empty all data will show
        let query = {};

        //  $regex logic
        if (search) {
          // $regex: to find anything with search value
          // $options: "i" case insensitive
          query.tutorName = { $regex: search, $options: "i" };
        }

        // date filtering logic ($gte & $lte)
        if (startDate || endDate) {
          query.startDate = {};

          if (startDate) {

            query.startDate.$gte = startDate;
          }
          if (endDate) {

            query.startDate.$lte = endDate;
          }
        }

        // now query to find data
        const result = await tutorCollection.find(query).toArray();
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
    app.get("/tutors/:id", verifyToken, async (req, res) => {
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
    app.post("/bookings", verifyToken, async (req, res) => {
      try {
        const bookingsData = req.body;

        bookingsData.status = "Confirmed";
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
          return res.status(400).json({
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

    // get tutors created by a single user
    app.get("/my-tutors/:userId", verifyToken, async (req, res) => {
      try {
        const { userId } = req.params;

        const result = await tutorCollection.find({ userId: userId }).toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // get bookings created by a single user
    app.get("/bookings/:userId", verifyToken, async (req, res) => {
      try {
        const { userId } = req.params;
        const result = await bookingCollection.find({ userId }).toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // Cancel booking & increase slot
    app.patch("/bookings/:id", verifyToken, async (req, res) => {
      try {
        const bookingId = new ObjectId(req.params.id);

        // find that booking
        const booking = await bookingCollection.findOne({ _id: bookingId });

        if (!booking || booking.status === "cancelled") {
          return res
            .status(400)
            .json({ message: "Invalid booking or already cancelled" });
        }

        // update status to cancel
        await bookingCollection.updateOne(
          { _id: bookingId },
          { $set: { status: "Cancelled" } },
        );

        // increase slot after cancel
        const tutor = await tutorCollection.findOne({
          _id: new ObjectId(booking.tutorId),
        });

        if (tutor) {
          const updatedSlot = (parseInt(tutor.totalSlot || 0) + 1).toString();

          await tutorCollection.updateOne(
            { _id: new ObjectId(booking.tutorId) },
            { $set: { totalSlot: updatedSlot } },
          );
        }

        res.json({ message: "Booking cancelled successfully" });
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // patch api to edit tutor data in my-tutors page
    app.patch("/tutors/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;

        const updatedData = req.body;

        const result = await tutorCollection.updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: updatedData,
          },
        );

        res.json(result);
      } catch (err) {
        res.status(500).json({
          message: "Server error",
          error: err.message,
        });
      }
    });

    // Delete tutor from my tutor page
    app.delete("/tutors/:id", verifyToken, async (req, res) => {
      try {
        const { id } = req.params;
        const result = await tutorCollection.deleteOne({
          _id: new ObjectId(id),
        });

        // if tutor get deleted then also cancel all of their booked slots
        if (result.deletedCount === 1) {
          await bookingCollection.updateMany(
            { tutorId: id },
            { $set: { status: "Cancelled" } },
          );
        }

        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    });

    // ***************************************** //
    // await client.db("admin").command({ ping: 1 });
    console.log("Ping pong. Server successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

