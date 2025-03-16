const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nugjc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    console.log("mongodb is connected");
    const jobsCollection = client.db("jobPortals").collection("jobs");
    const jobApplication = client.db("jobPortals").collection("applicant");
    app.get("/", (req, res) => {
      res.send("my job portals server is running ");
    });

    app.get("/jobs", async (req, res) => {
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const newJobs = req.body;
      const result = await jobsCollection.insertOne(newJobs);
      res.send(result);
    });

    app.get("/job_application/jobs/:job_id", async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId };
      const result = await jobApplication.find(query).toArray();
      res.send(result);
    });

    app.post("/job_application", async (req, res) => {
      const application = req.body;
      const result = await jobApplication.insertOne(application);
      res.send(result);

      const id = application.job_id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);

      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      } else {
        newCount = 1;
      }

      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          applicationCount: newCount,
        },
      };
      const updateResult = await jobsCollection.updateOne(filter, updateDoc);
      res.send(job);
    });

    app.get("/job_application", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplication.find(query).toArray();

      for (const application of result) {
        console.log(application.job_id);
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.location = job.location;
          application.company = job.company;
          application.company_logo = job.company_logo;
        }
      }

      res.send(result);
    });

    app.listen(port, () => {
      console.log(`server is running on port : ${port}`);
    });
  } catch (error) {
    console.log("mongodb error");
  }
}
run();
