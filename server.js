const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ObjectId } = require("mongodb");
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

    // Send invitation to contact
app.post("/api/sendInvitation", async (req, res) => {
  // incoming: contactId
  // outgoing: success message or error
  console.log("Sending invitation to contact: ", req.body);

  const { contactId } = req.body;
  let error = "";

  if (!contactId) {
    error = "Contact ID is required.";
    return res.status(400).json({ success: false, error });
  }

  try {
    const db = client.db();
    const contactsCollection = db.collection("Contacts");

    // Get the contact
    const contact = await contactsCollection.findOne({
      _id: new ObjectId(contactId),
    });

    if (!contact) {
      error = "Contact not found.";
      return res.status(404).json({ success: false, error });
    }

    // Get the event
    const eventsCollection = db.collection("Events");
    const event = await eventsCollection.findOne({
      _id: new ObjectId(contact.EventId),
    });

    if (!event) {
      error = "Event not found.";
      return res.status(404).json({ success: false, error });
    }

    // In a real application, you would send an email here
    console.log(`Sending invitation to ${contact.Email} for event ${event.Title}`);

    // Update contact status to 'invited'
    await contactsCollection.updateOne(
      { _id: new ObjectId(contactId) },
      {
        $set: {
          Status: "invited",
          InvitedAt: new Date(),
        },
      }
    );

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error sending invitation:", err);
    error = "An error occurred while sending the invitation.";
    res.status(500).json({ success: false, error });
  }
});

// Search contacts
app.post("/api/searchContacts", async (req, res, next) => {
  // incoming: eventId, search - search is partial match for firstName, lastName, or email
  // outgoing: results array or error
  const { eventId, search } = req.body;
  let error = "";

  if (!eventId || !search) {
    error = "Missing eventId or search term.";
    return res.status(400).json({ results: [], error });
  }

  try {
    const db = client.db();
    const contactsCollection = db.collection("Contacts");

    const regex = new RegExp(search, "i"); // case-insensitive partial match

    const results = await contactsCollection
      .find({
        EventId: eventId.toString(),
        $or: [
          { FirstName: regex },
          { LastName: regex },
          { Email: regex },
        ],
      })
      .toArray();

    const contacts = results.map((contact) => ({
      id: contact._id,
      eventId: contact.EventId,
      name: `${contact.FirstName} ${contact.LastName}`.trim(),
      email: contact.Email,
      status: contact.Status || "pending",
    }));

    res.status(200).json({ results: contacts, error: "" });
  } catch (err) {
    console.error("Error searching contacts:", err);
    error = "An error occurred while searching contacts.";
    res.status(500).json({ results: [], error });
  }
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
//change all occurrences of 5001 to 5000 for your own testing if you want Access the database (EventManager)
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

    // Create Events collection if it doesn't exist
    if (!collections.some((collection) => collection.name === "Events")) {
      await db.createCollection("Events");
      console.log("Events collection created");
    } else {
      console.log("Events collection found");
    }

    // Create Contacts collection if it doesn't exist
    if (!collections.some((collection) => collection.name === "Contacts")) {
      await db.createCollection("Contacts");
      console.log("Contacts collection created");
    } else {
      console.log("Contacts collection found");
    }
  } catch (error) {
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

// Get user events
app.post("/api/getUserEvents", async (req, res) => {
  // incoming: userId
  // outgoing: events array or error
  console.log("Getting events for user: ", req.body);

  const { userId } = req.body;
  let error = "";

  if (!userId) {
    error = "User ID is required.";
    return res.status(400).json({ events: [], error });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");

    // Find all events for this user
    const events = await eventsCollection
      .find({ UserId: userId.toString() })
      .toArray();

    // For each event, get its contacts
    const eventsWithContacts = await Promise.all(
      events.map(async (event) => {
        const contactsCollection = db.collection("Contacts");
        const contacts = await contactsCollection
          .find({ EventId: event._id.toString() })
          .toArray();

        // Format contacts for the frontend
        const formattedContacts = contacts.map((contact) => ({
          id: contact._id,
          name: `${contact.FirstName} ${contact.LastName}`,
          email: contact.Email,
          attending: contact.Status || "pending",
        }));

        return {
          ...event,
          Contacts: formattedContacts,
        };
      })
    );

    res.status(200).json({ events: eventsWithContacts, error: "" });
  } catch (err) {
    console.error("Error fetching events:", err);
    error = "An error occurred while fetching events.";
    res.status(500).json({ events: [], error });
  }
});

// Add new event
app.post("/api/addEvent", async (req, res) => {
  // incoming: userId, title, date, time, location, image (optional), description (optional)
  // outgoing: eventId or error
  console.log("Adding new event: ", req.body);

  const { userId, title, date, time, location, image, description } = req.body;
  let error = "";

  if (!userId || !title || !date || !time || !location) {
    error = "Required fields missing.";
    return res.status(400).json({ eventId: -1, error });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");

    // Create new event
    const newEvent = {
      UserId: userId.toString(),
      Title: title,
      Date: date,
      Time: time,
      Location: location,
      Image: image || "📅",
      Description: description || "",
      CreatedAt: new Date(),
    };

    const result = await eventsCollection.insertOne(newEvent);

    res.status(200).json({ eventId: result.insertedId, error: "" });
  } catch (err) {
    console.error("Error adding event:", err);
    error = "An error occurred while adding the event.";
    res.status(500).json({ eventId: -1, error });
  }
});

// Update event
app.post("/api/updateEvent", async (req, res) => {
  // incoming: eventId, title, date, time, location, image, description
  // outgoing: success message or error
  console.log("Updating event: ", req.body);

  const { eventId, title, date, time, location, image, description } = req.body;
  let error = "";

  if (!eventId || !title || !date || !time || !location) {
    error = "Required fields missing.";
    return res.status(400).json({ success: false, error });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");

    // Update the event
    const updateResult = await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          Title: title,
          Date: date,
          Time: time,
          Location: location,
          Image: image || "📅",
          Description: description || "",
          UpdatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      error = "Event not found.";
      return res.status(404).json({ success: false, error });
    }

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error updating event:", err);
    error = "An error occurred while updating the event.";
    res.status(500).json({ success: false, error });
  }
});

// Delete event
app.post("/api/deleteEvent", async (req, res) => {
  // incoming: eventId
  // outgoing: success message or error
  console.log("Deleting event: ", req.body);

  const { eventId } = req.body;
  let error = "";

  if (!eventId) {
    error = "Event ID is required.";
    return res.status(400).json({ success: false, error });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");
    const contactsCollection = db.collection("Contacts");

    // Delete the event
    const deleteResult = await eventsCollection.deleteOne({
      _id: new ObjectId(eventId),
    });

    if (deleteResult.deletedCount === 0) {
      error = "Event not found.";
      return res.status(404).json({ success: false, error });
    }

    // Delete all contacts associated with this event
    await contactsCollection.deleteMany({ EventId: eventId.toString() });

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error deleting event:", err);
    error = "An error occurred while deleting the event.";
    res.status(500).json({ success: false, error });
  }
});

// Add contact to event
app.post("/api/addContact", async (req, res) => {
  // incoming: eventId, firstName, lastName, email, status
  // outgoing: contactId or error
  console.log("Adding contact: ", req.body);

  const { eventId, firstName, lastName, email, status } = req.body;
  let error = "";

  if (!eventId || !firstName || !email) {
    error = "Required fields missing.";
    return res.status(400).json({ contactId: -1, error });
  }

  try {
    const db = client.db();
    const contactsCollection = db.collection("Contacts");

    // Check if the event exists
    const eventsCollection = db.collection("Events");
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
    });

    if (!event) {
      error = "Event not found.";
      return res.status(404).json({ contactId: -1, error });
    }

    // Check if contact already exists for this event
    const existingContact = await contactsCollection.findOne({
      EventId: eventId.toString(),
      Email: email,
    });

    if (existingContact) {
      error = "Contact with this email already exists for this event.";
      return res.status(400).json({ contactId: -1, error });
    }

    // Create new contact
    const newContact = {
      EventId: eventId.toString(),
      FirstName: firstName,
      LastName: lastName || "",
      Email: email,
      Status: status || "pending",
      CreatedAt: new Date(),
    };

    const result = await contactsCollection.insertOne(newContact);

    res.status(200).json({ contactId: result.insertedId, error: "" });
  } catch (err) {
    console.error("Error adding contact:", err);
    error = "An error occurred while adding the contact.";
    res.status(500).json({ contactId: -1, error });
  }
});

// Update contact status
app.post("/api/updateContactStatus", async (req, res) => {
  // incoming: contactId, status
  // outgoing: success message or error
  console.log("Updating contact status: ", req.body);

  const { contactId, status } = req.body;
  let error = "";

  if (!contactId || !status) {
    error = "Contact ID and status are required.";
    return res.status(400).json({ success: false, error });
  }

  try {
    const db = client.db();
    const contactsCollection = db.collection("Contacts");

    // Update contact status
    const updateResult = await contactsCollection.updateOne(
      { _id: new ObjectId(contactId) },
      {
        $set: {
          Status: status,
          UpdatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      error = "Contact not found.";
      return res.status(404).json({ success: false, error });
    }

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error updating contact status:", err);
    error = "An error occurred while updating the contact status.";
    res.status(500).json({ success: false, error });
  }
});

// Delete contact
app.post("/api/deleteContact", async (req, res) => {
  // incoming: contactId
  // outgoing: success message or error
  console.log("Deleting contact: ", req.body);

  const { contactId } = req.body;
  let error = "";

  if (!contactId) {
    error = "Contact ID is required.";
    return res.status(400).json({ success: false, error });
  }

  try {
    const db = client.db();
    const contactsCollection = db.collection("Contacts");

    // Delete the contact
    const deleteResult = await contactsCollection.deleteOne({
      _id: new ObjectId(contactId),
    });

    if (deleteResult.deletedCount === 0) {
      error = "Contact not found.";
      return res.status(404).json({ success: false, error });
    }

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error deleting contact:", err);
    error = "An error occurred while deleting the contact.";
    res.status(500).json({ success: false, error });
  }
});

//