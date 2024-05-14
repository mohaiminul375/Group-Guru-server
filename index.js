const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
// middle ware
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

// verify jwt token]
const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: "unauthorized access" });
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        console.log("error", err);
        return res.status(401).send({ message: "unauthorized access" });
      }
      console.log("decoded", decoded);
      req.user = decoded;
      next();
    });
  }
};

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

    // jwt create jwt
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN, {
        expiresIn: "72h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    // clear token after logout

    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    // get
    // get all assignmet
    // app.get("/all-assignment", async (req, res) => {
    //   const result = await assignmentCollection.find().toArray();
    //   res.send(result);
    // });



   //  count all assignment
   app.get("/all-assignment-count", async (req, res) => {
    const filter=req.query.filter;
    let query={};
    if(filter) query={difficulty_level:filter}
    const count = await assignmentCollection.countDocuments(query);
    res.send({ count });
  });
  // all assignment with filter
  app.get("/all-assignment", async (req, res) => {
    const size = parseInt(req.query.size);
    const page = parseInt(req.query.page) - 1;
    const filter=req.query.filter;
    console.log(size, page);
    let query={}
    if(filter) query={difficulty_level:filter}
    const result = await assignmentCollection
      .find(query)
      .skip(page * size)
      .limit(size)
      .toArray();
    res.send(result);
  });



    // ge assignment by id
    app.get("/all-assignment/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query);
      res.send(result);
    });

    // get submitted assignment by user (must use jwt)
    app.get("/submitted-assignment", verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      if (req.query?.email !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { examinee_email: req.query.email };
      }
      const result = await submissionCollection.find(query).toArray();
      res.send(result);
    });

    // get data by pending
    app.get("/pending-assignment", verifyToken, async (req, res) => {
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
    app.post("/all-assignment", verifyToken, async (req, res) => {
      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });
    // post all pending assignment
    app.post("/submitted-assignment", verifyToken, async (req, res) => {
      const submission = req.body;
      const result = await submissionCollection.insertOne(submission);
      res.send(result);
    });

    // patch
    app.patch("/submitted-assignment/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateSubmission = req.body;
      // console.log(updateSubmission);
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
    // path assignment data
    app.patch("/all-assignment/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateAssignment = req.body;
      console.log(updateAssignment);
      const updateDoc = {
        $set: {
          ...updateAssignment,
        },
      };
      const result = await assignmentCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // delete
    app.delete("/all-assignment/:id", verifyToken, async (req, res) => {
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
