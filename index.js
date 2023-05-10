const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.srpuqkb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersCollection = client.db("anaf").collection("users");
    const ordersCollection = client.db("anaf").collection("orders");

    // create user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    // get user
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const userData = await usersCollection.findOne(query);
      res.send(userData);
    });
    // delete user
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });
    // post orders
    app.post("/orders", async (req, res) => {
      const user = req.body;
      const result = await ordersCollection.insertOne(user);
      res.send(result);
    });
    // get all orders
    app.get("/orders", async (req, res) => {
      const query = {};
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });
    // get user orders
    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });
    // get user orders detail
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const orderDetails = await ordersCollection.findOne(query);
      res.send(orderDetails);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Anaf server running....");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
