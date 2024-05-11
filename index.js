const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());
app.use(cors());
console.log(process.env.DB_USER);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ixszr3u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const assignmentCollection = client
      .db("group-guru")
      .collection("all-assignment");
    const submissionCollection = client
      .db("group-guru")
      .collection("submitted-assignment");

    // get
    // get all assignmet
    app.get("/all-assignment", async (req, res) => {
      const result = await assignmentCollection.find().toArray();
      res.send(result);
    });

    // ge assignment by id
    app.get("/all-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    // get submitted assignment by user (must use jwt)
    app.get("/submitted-assignment", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { examinee_email: req.query.email };
      }
      const result = await submissionCollection.find(query).toArray();
      res.send(result);
    });

    // get data by pending
    app.get("/pending-assignment", async (req, res) => {
      // const assignments=req.params.status;
      let query = {};
      if (req.query?.status) {
        query = { status: "pending" };
      }
      // const query={status:'pending'}
      const result = await submissionCollection.find(query).toArray();
      res.send(result);
    });

    // post
    app.post("/all-assignment", async (req, res) => {
      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });
    // post all pending assignment
    app.post("/submitted-assignment", async (req, res) => {
      const submission = req.body;
      const result = await submissionCollection.insertOne(submission);
      res.send(result);
    });

    // patch
    app.patch("/submitted-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateSubmission = req.body;
      console.log(updateSubmission);
      const updateDoc = {
        $set: {
          obtain_marks: updateSubmission.obtain_marks,
          feedback: updateSubmission.feedback,
          status: updateSubmission.status,
        },
      };
      const result = await submissionCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // delete
    app.delete("/all-assignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server in working");
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
