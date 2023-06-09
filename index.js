const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
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

function verifyJWT(req, res, next) {
  console.log("inside", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorize access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    const usersCollection = client.db("anaf").collection("users");
    const ordersCollection = client.db("anaf").collection("orders");
    const productsCollection = client.db("anaf").collection("products");
    // const textIndex = await productsCollection.createIndex({
    //   a: 1,
    //   "$**": "text",
    // });
    // verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    app.get("/search", async (req, res) => {
      const search = req.query.search;
      console.log(search);
      const query = { name: { $regex: search, $options: "i" } };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    // jwt user send token
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "7d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    // get products
    app.get("/products", async (req, res) => {
      const query = {};
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });
    // get category products
    app.get("/product/category", async (req, res) => {
      const category = req.query.category;
      console.log(category);
      const query = { category };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });
    // get single product
    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.send(product);
    });
    // add products
    app.post("/products", verifyJWT, verifyAdmin, async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
    // update product
    app.put("/updateProduct/:id", async (req, res) => {
      const id = req.params.id;
      const updateProduct = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      console.log(updateProduct);
      const updateDoc = {
        $set: {
          // updateProduct
          id: updateProduct.id,
          category: updateProduct.category,
          name: updateProduct.name,
          price: updateProduct.price,
          img: updateProduct.img,
          detail: updateProduct.detail,
          outOfStock: updateProduct.outOfStock,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        option
      );
      res.send(result);
    });
    // create user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    // get all users
    app.get("/allUsers", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
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

    // get order
    app.get("/find/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });
    // get all orders
    app.get("/orders", verifyJWT, verifyAdmin, async (req, res) => {
      const query = {};
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });
    // update order status
    app.put("/order/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updateStatus = req.body;
      console.log(updateStatus);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          status: updateStatus.status,
        },
      };
      const result = await ordersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    // delete order
    app.delete("/deleteOrder/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await ordersCollection.deleteOne(filter);
      res.send(result);
    });
    // get user orders
    app.get("/order", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { email };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });
    // get user orders detail
    app.get("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const orderDetails = await ordersCollection.findOne(query);
      res.send(orderDetails);
    });
    // get admin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    // create admin
    app.put("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    // update
    // app.get("/up", async (req, res) => {
    //   const filter = {};
    //   const option = { upsert: true };
    //   const updateDoc = {
    //     $set: {
    //       outOfStock: "false",
    //     },
    //   };
    //   const result = await productsCollection.updateMany(
    //     filter,
    //     updateDoc,
    //     option
    //   );
    //   res.send(result);
    // });
    // remove admin
    app.put("/users/cancel/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "normal user",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
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
