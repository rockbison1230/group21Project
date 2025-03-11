const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // Access the database (EventManager)
    const db = client.db("EventManager");
    console.log("Currently connected to the database:", db.databaseName);

    // List available collections in the connected database
    const collections = await db.listCollections().toArray();
    console.log(
      "Available collections in the database:",
      collections.map((collection) => collection.name)
    );

    // Optionally, verify the 'Users' collection exists
    if (!collections.some((collection) => collection.name === "Users")) {
      console.log("Users collection not found");
    } else {
      console.log("Users collection found");
    }
  } catch {
    console.error("Error connecting to MongoDB:", error);
  }
}
connectDB();

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.post("/api/register", async (req, res, next) => {
  // incoming: firstName, lastName, userName, emailAddress, password
  // outgoing: id, firstName, lastName, userName, emailAddress, password, error
  console.log("Request data: ", req.body);

  let error = "";
  const { firstName, lastName, userName, emailAddress, password } = req.body;

  if (!firstName || !lastName || !userName || !emailAddress || !password) {
    error = "All fields are required.";
    return res
      .status(400)
      .json({ id: -1, firstName: "", lastName: "", emailAddress: "", error });
  }

  try {
    const db = client.db();
    const usersCollection = db.collection("Users");

    const existingUser = await usersCollection.findOne({ Email: emailAddress });
    if (existingUser) {
      error = "Email already exists.";
      return res
        .status(400)
        .json({ id: -1, firstName: "", lastName: "", emailAddress: "", error });
    }

    // add new user
    const newUser = {
      FirstName: firstName,
      LastName: lastName,
      Username: userName,
      Password: password,
      Email: emailAddress,
    };

    const result = await usersCollection.insertOne(newUser);

    const ret = {
      id: result.insertedId,
      firstName,
      lastName,
      userName,
      password,
      emailAddress,
      error: "",
    };

    res.status(200).json(ret);
  } catch (err) {
    console.error("Error during registration:", err);
    error = "An error occurred during registration.";
    res
      .status(500)
      .json({ id: -1, firstName: "", lastName: "", emailAddress: "", error });
  }
});
app.get("/api/login", (req, res) => {
  // Handle GET requests to /api/login
  res.status(200).json({ message: "Login page" });
});
app.post("/api/login", async (req, res, next) => {
  // incoming: login, password
  // outgoing: id, firstName, lastName, email, error
  console.log("Request data: ", req.body);

  var error = "";
  const { login, password } = req.body;
  const db = client.db();
  const results = await db
    .collection("Users")
    .find({ Username: login, Password: password })
    .toArray();
  const user = await db.collection("Users").findOne({ Username: login });
  console.log("User found:", user);
  var id = -1;
  var fn = "";
  var ln = "";
  var email = "";
  console.log(results.length);
  if (results.length > 0) {
    id = results[0]._id;
    fn = results[0].FirstName;
    ln = results[0].LastName;
    email = results[0].Email;
  }
  var ret = { id: id, firstName: fn, lastName: ln, email: email, error: "" };
  res.status(200).json(ret);
});

app.post("/api/addcard", async (req, res, next) => {
  // incoming: userId, color
  // outgoing: error

  var error = "";

  const { userId, card } = req.body;

  // TEMP FOR LOCAL TESTING.
  cardList.push(card);

  var ret = { error: error };
  res.status(200).json(ret);
});

app.post("/api/searchcards", async (req, res, next) => {
  // incoming: userId, search
  // outgoing: results[], error
  // var error = '';
  // const { userId, search } = req.body;
  // var _search = search.toLowerCase().trim();
  // var _ret = [];
  // for( var i=0; i<cardList.length; i++ )
  // {
  //   var lowerFromList = cardList[i].toLocaleLowerCase();
  //   if( lowerFromList.indexOf( _search ) >= 0 )
  //   {
  //     _ret.push( cardList[i] );
  //   }
  // }
  // var ret = {results:_ret, error:''};
  // res.status(200).json(ret);
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  next();
});

app.listen(5001); // start Node + Express server on port 5000. port 5000 is occupied on my computer so it's port 5001 here, but just
//cahnge all occurences of 5001 to 5000 for ur own testing if you want
