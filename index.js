const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
console.log(process.env.DB_USER);

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://group_gure:7To2b6eDLFiBr4Pe@cluster0.ixszr3u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
   const assignmentCollection=client.db('group-guru').collection('all-assignment')
    // get
   app.get('/all-assignment',async(req,res)=>{
    const result= await assignmentCollection.find().toArray()
    res.send(result)
   })
    // post
    app.post('/all-assignment',async(req,res)=>{
        const assignment=req.body;
        const result = await assignmentCollection.insertOne(assignment);
        res.send(result)

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
