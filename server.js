const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
const crypto = require('crypto');
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
  } 
  catch (error) {
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

    const verificationToken = crypto.randomBytes(5).toString('hex');

    // add new user
    const newUser = {
      FirstName: firstName,
      LastName: lastName,
      Username: userName,
      Password: password,
      Email: emailAddress,
      isVerified: false,
      vToken: verificationToken,
    };

    const result = await usersCollection.insertOne(newUser);
    sendVerificationEmail(emailAddress, verificationToken);

    const ret = {
      id: result.insertedId,
      firstName,
      lastName,
      userName,
      password,
      emailAddress,
      isVerified: false, 
      error: "",
    };

    res.status(200).json(ret);
  } catch (err) {
    console.error("Error during registration:", err);
    error = "An error occurred during registration.";
    res
      .status(500)
      .json({ id: -1, firstName: "", lastName: "", emailAddress: "", isVerified: false, error });
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
  var isVerified = false;

  console.log(results.length);
  if (results.length > 0) {
    id = results[0]._id;
    fn = results[0].FirstName;
    ln = results[0].LastName;
    email = results[0].Email;
    isVerified = results[0].isVerified;
  }

  if (!isVerified) {
    error = "Email verification is required before login.";
    return res.status(400).json({ id: -1, firstName: "", lastName: "", email: "", isVerified: false, error });
  }

  var ret = { id: id, firstName: fn, lastName: ln, email: email, isVerified: isVerified, error: "" };
  res.status(200).json(ret);
});

// Get an array of User's events
app.post("/api/getUserEvents", async (req, res) => {
  console.log("Getting events for user: ", req.body);

  const { userId } = req.body;
  let error = "";

  if (!userId) {
    return res.status(400).json({ events: [], error: "User ID is required." });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");

    let userIdQuery;
    if (ObjectId.isValid(userId)) {
      userIdQuery = new ObjectId(userId);
    } else {
      return res.status(400).json({ events: [], error: "Invalid User ID." });
    }

    // Find all events for this user
    const events = await eventsCollection
      .find({ HostID: userIdQuery }) // Changed to HostID
      .toArray();

    // For each event, get its guests
    const eventsWithGuests = await Promise.all(
      events.map(async (event) => {
        const guestsCollection = db.collection("Guests"); // Changed to Guests
        const eventIdQuery = new ObjectId(event._id);
        const guests = await guestsCollection
          .find({ EventID: eventIdQuery }) // Changed to EventID
          .toArray();

        // Format guests for the frontend
        const formattedGuests = guests.map((guest) => ({
          id: guest._id,
          name: `${guest.FirstName} ${guest.LastName}`,
          email: guest.Email,
          attending: guest.Status || "pending",
        }));

        return {
          ...event,
          Guests: formattedGuests, // Changed to Guests
        };
      })
    );

    res.status(200).json({ events: eventsWithGuests, error: "" });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ events: [], error: "An error occurred while fetching events." });
  }
});

// Add new event
app.post("/api/addEvent", async (req, res) => {
  console.log("Adding new event: ", req.body);

  const { userId, title, date, time, location, image, description } = req.body;
  let error = "";

  if (!userId || !title || !date || !time || !location) {
    return res.status(400).json({ eventId: -1, error: "Required fields missing." });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");

      // Convert HostID to ObjectId if it's a valid string representation
      let hostIdQuery;
      if (ObjectId.isValid(userId)) 
      {
        hostIdQuery = new ObjectId(userId);
      } 
      else 
      {
        hostIdQuery = userId; // If userId isn't valid, we keep it as is
      }

    const newEvent = {
      HostID: hostIdQuery, // Changed to HostID
      EventName: title, // Changed to EventName
      Date: date,
      Time: time,
      Location: location,
      Image: image || "",
      Description: description || "",
      CreatedAt: new Date(),
    };

    const result = await eventsCollection.insertOne(newEvent);

    res.status(200).json({ eventId: result.insertedId, error: "" });
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ eventId: -1, error: "An error occurred while adding the event." });
  }
});

// Delete event
app.post("/api/deleteEvent", async (req, res) => {
  console.log("Deleting event: ", req.body);

  const { eventId, userId } = req.body;
  let error = "";

  if (!eventId || !userId) {
    return res.status(400).json({ success: false, error: "Event ID and User ID are required." });
  }

  try {
    let eventObjectId, userObjectId;

    // Validate and convert both IDs
    if (ObjectId.isValid(eventId) && ObjectId.isValid(userId)) {
      eventObjectId = new ObjectId(eventId);
      userObjectId = new ObjectId(userId);
    } else {
      return res.status(400).json({ success: false, error: "Invalid Event ID or User ID." });
    }

    const db = client.db();
    const eventsCollection = db.collection("Events");
    const guestsCollection = db.collection("Guests");

    // Ownership check: user must own the event
    const deleteResult = await eventsCollection.deleteOne({
      _id: eventObjectId,
      HostID: userObjectId, // HostID is now checked as an ObjectId
    });

    if (deleteResult.deletedCount === 0) {
      // Either event not found or user doesn't own it
      const eventExists = await eventsCollection.findOne({ _id: eventObjectId });
      if (eventExists) {
        return res.status(403).json({ success: false, error: "You are not authorized to delete this event." });
      } else {
        return res.status(404).json({ success: false, error: "Event not found." });
      }
    }

    // Delete associated guests by matching EventID as ObjectId
    await guestsCollection.deleteMany({ EventID: eventObjectId });

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ success: false, error: "An error occurred while deleting the event." });
  }
});

// Search contacts
app.post("/api/searchContacts", async (req, res, next) => {
  const { eventId, search } = req.body;

  console.log("Received request:", { eventId, search });

  if (!eventId) {
    console.error("Error: Missing eventId.");
    return res.status(400).json({ results: [], error: "Missing eventId." });
  }

  try {
    const db = client.db();

    // Access Guests collection
    const contactsCollection = db.collection("Guests");

    let eventIdQuery;
    if (ObjectId.isValid(eventId)) {
      eventIdQuery = new ObjectId(eventId);
    } else {
      eventIdQuery = eventId;
    }

    const eventIdString = `ObjectId('${eventId}')`;

    // Modify query to return all guests under the eventId if search is empty
    const query = {
      EventID: { $in: [eventIdQuery, eventId, eventIdString] },
      ...(search ? { $or: [
        { FirstName: new RegExp(search, "i") },
        { LastName: new RegExp(search, "i") },
        { Email: new RegExp(search, "i") },
      ] } : {})
    };

    const results = await contactsCollection.find(query).toArray();

    const contacts = results.map((contact) => ({
      id: contact._id,
      eventId: contact.EventID,
      name: `${contact.FirstName} ${contact.LastName}`.trim(),
      email: contact.Email || "",
      status: contact.Status || "pending",
    }));

    res.status(200).json({ results: contacts, error: "" });
  } catch (err) {
    res.status(500).json({ results: [], error: "An error occurred while searching contacts." });
  }
});

// Search Events
app.post("/api/searchEvents", async (req, res, next) => {
  const { hostId, search } = req.body;

  console.log("Received request:", { hostId, search });

  if (!hostId) {
    console.error("Error: Missing hostId.");
    return res.status(400).json({ results: [], error: "Missing hostId." });
  }

  try {
    const db = client.db();

    // Access Events collection
    const eventsCollection = db.collection("Events");

    let hostIdQuery;
    if (ObjectId.isValid(hostId)) {
      hostIdQuery = new ObjectId(hostId);
    } else {
      hostIdQuery = hostId;
    }

    const hostIdString = `ObjectId('${hostId}')`;

    // Modify query to return all events under the hostId if search is empty
    const query = {
      HostID: { $in: [hostIdQuery, hostId, hostIdString] },
      ...(search ? {
        $or: [
          { EventName: new RegExp(search, "i") },
          { Location: new RegExp(search, "i") },
          { Description: new RegExp(search, "i") },
          { Date: new RegExp(search, "i") }, 
        ],
      } : {}),
    };

    const results = await eventsCollection.find(query).toArray();

    const events = results.map((event) => ({
      id: event._id,
      hostId: event.HostID,
      name: event.EventName,
      date: event.Date,
      location: event.Location,
      description: event.Description || "",
      image: event.Image || "",
    }));

    res.status(200).json({ results: events, error: "" });
  } catch (err) {
    res.status(500).json({ results: [], error: "An error occurred while searching events." });
  }
});


// Delete contact
app.post("/api/deleteContacts", async (req, res, next) => {
  const { contactId } = req.body;

  console.log("Received delete request for contact:", { contactId });

  if (!contactId) {
    console.error("Error: Missing contactId.");
    return res.status(400).json({ success: false, error: "Missing contactId." });
  }

  try {
    const db = client.db();
    const contactsCollection = db.collection("Guests");

    let contactIdQuery;
    if (ObjectId.isValid(contactId)) {
      contactIdQuery = new ObjectId(contactId);
    } else {
      console.error("Error: Invalid contactId format.");
      return res.status(400).json({ success: false, error: "Invalid contactId format." });
    }

    const deleteResult = await contactsCollection.deleteOne({ _id: contactIdQuery });

    if (deleteResult.deletedCount === 1) {
      console.log("Successfully deleted contact:", contactId);
      res.status(200).json({ success: true, message: "Contact deleted successfully." });
    } else {
      console.log("No contact found with the given contactId.");
      res.status(404).json({ success: false, error: "Contact not found." });
    }
  } catch (err) {
    console.error("Error deleting contact:", err);
    res.status(500).json({ success: false, error: "An error occurred while deleting the contact." });
  }
  // test data
  // "EventID": "ObjectId('67bd434d293afd96eae2e86b')",
  // "FirstName": "Joanna",
  // "LastName": "Britto",
  // "Phone": "123-123-1234",
  // "Status": 1
});


// Update guest status
app.post("/api/updateGuestStatus", async (req, res) => {
  console.log("Updating guest status: ", req.body);

  const { eventId, guestId, status } = req.body;
  let error = "";

  if (!eventId || !guestId || !status) {
    return res.status(400).json({
      success: false,
      error: "Event ID, Guest ID, and Status are required.",
    });
  }

  try {
    let eventObjectId, guestObjectId;

    // Validate and convert IDs
    if (ObjectId.isValid(eventId) && ObjectId.isValid(guestId)) {
      eventObjectId = new ObjectId(eventId);
      guestObjectId = new ObjectId(guestId);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid Event ID or Guest ID.",
      });
    }

    const db = client.db();
    const guestsCollection = db.collection("Guests");

    // Check if the guest exists for this event
    const guest = await guestsCollection.findOne({
      _id: guestObjectId,
      EventID: eventObjectId, // Use ObjectId here
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        error: "Guest not found for this event.",
      });
    }

    // Update the guest status and add UpdatedAt
    const updateResult = await guestsCollection.updateOne(
      { _id: guestObjectId, EventID: eventObjectId }, // Use ObjectId here
      { $set: { Status: status, UpdatedAt: new Date() } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        error: "Failed to update guest status.",
      });
    }

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error updating guest status:", err);
    res.status(500).json({
      success: false,
      error: "An error occurred while updating the guest status.",
    });
  }
});

// Handling GET request for updateGuestStatus
app.get("/api/updateGuestStatus", async (req, res) => {
  console.log("GET request - Updating guest status");

  const { eventId, guestId, status } = req.query;
  let error = "";

  if (!eventId || !guestId || !status) {
    return res.status(400).json({
      success: false,
      error: "Event ID, Guest ID, and Status are required.",
    });
  }

  try {
    let eventObjectId, guestObjectId;

    // Validate and convert IDs
    if (ObjectId.isValid(eventId) && ObjectId.isValid(guestId)) {
      eventObjectId = new ObjectId(eventId);
      guestObjectId = new ObjectId(guestId);
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid Event ID or Guest ID.",
      });
    }

    const db = client.db();
    const guestsCollection = db.collection("Guests");

    // Check if the guest exists for this event
    const guest = await guestsCollection.findOne({
      _id: guestObjectId,
      EventID: eventObjectId, // Use ObjectId here
    });

    if (!guest) {
      return res.status(404).json({
        success: false,
        error: "Guest not found for this event.",
      });
    }

    // Update the guest status and add UpdatedAt
    const updateResult = await guestsCollection.updateOne(
      { _id: guestObjectId, EventID: eventObjectId }, // Use ObjectId here
      { $set: { Status: status, UpdatedAt: new Date() } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        error: "Failed to update guest status.",
      });
    }

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error updating guest status:", err);
    res.status(500).json({
      success: false,
      error: "An error occurred while updating the guest status.",
    });
  }
});


async function sendVerificationEmail(emailAddress, verificationToken) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });


  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailAddress,
    subject: 'Espresso Events Email Verification',
    text: `Please use this code to finish your registration ${verificationToken}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('sent verification email');
  } catch (error) {
    console.error('error sending mail: ', error);
  }
}

// on successful verification route to login?
app.post('/api/verify', async (req, res) => {
  const { token } = req.body;
  console.log("api reached");

  const db = client.db();
  const usersCollection = db.collection("Users");

  const user = await usersCollection.findOne({ vToken: token });

  if (!user) {
    return res.status(400).json({ message: 'Invalid token' });
  }

  try {
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { isVerified: true, vToken: null } }
    );
    res.status(200).json({ message: 'Verification Successful!' });
  } catch (err) {
    console.error('Error updating user: ', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/sendGuestInvite', async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId' });
  }

  try {
    let eventIdQuery;
    if (ObjectId.isValid(eventId)) {
      eventIdQuery = new ObjectId(eventId);  // Corrected: Convert eventId to ObjectId
    } else {
      // If eventId is not a valid ObjectId, return an error
      return res.status(400).json({ error: 'Invalid eventId format' });
    }

    const db = client.db();

    // Fetch event details from the Events collection
    const event = await db.collection('Events').findOne({ _id: eventIdQuery });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    console.log(`Sending invites for Event: ${event.EventName}`);

    // Fetch guests for the event
    const guests = await db.collection('Guests').find({ EventID: eventIdQuery }).toArray();

    if (!guests.length) {
      return res.status(404).json({ error: 'No guests found for this event' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const guest of guests) {
      if (!guest.Email) continue;

      // const approveUrl = `http://localhost:5001/api/updateGuestStatus?eventId=${eventId}&guestId=${guest._id}&status=1`;
      // const rejectUrl = `http://localhost:5001/api/updateGuestStatus?eventId=${eventId}&guestId=${guest._id}&status=0`;
      
      const approveUrl = `http://espressoevents.xyz:5001/api/updateGuestStatus?eventId=${eventId}&guestId=${guest._id}&status=1`;
      const rejectUrl = `http://espressoevents.xyz:5001/api/updateGuestStatus?eventId=${eventId}&guestId=${guest._id}&status=0`;



      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: guest.Email,
        subject: 'Please RSVP here!',
        html: `
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
            .header { background-color: #6F4F37; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h2 { margin: 0; font-size: 24px; }
            .details { margin-top: 20px; }
            .details h3 { font-size: 20px; color: #6F4F37; }
            .details p { font-size: 16px; color: #555; }
            .button { padding: 10px 20px; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px; margin-right: 10px; }
            .approve { background-color: #4CAF50; }
            .reject { background-color: #f44336; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #777; }
            .footer a { color: #6F4F37; text-decoration: none; font-weight: bold; }
          </style>
          <div class="container">
            <div class="header">
              <h2>Will You Attend?</h2>
            </div>
            <div class="details">
              <h3>Event Details:</h3>
              <p><strong>Event Name:</strong> ${event.EventName}</p>
              <p><strong>Date:</strong> ${event.Date}</p>
              <p><strong>Time:</strong> ${event.Time}</p>
              <p><strong>Location:</strong> ${event.Location}</p>
              <p><strong>Description:</strong> ${event.Description || "No description provided"}</p>
            </div>
            <div>
              <a href="${approveUrl}" class="button approve">Yes!</a>
              <a href="${rejectUrl}" class="button reject">No</a>
            </div>
            <div class="footer">
              <p>Powered by <a href="http://espressoevents.xyz">Espresso Events</a></p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({ message: 'Invites sent to all guests for the event' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send invites' });
  }
});

app.post("/api/addGuest", async (req, res) => {
  // incoming: eventId, firstName, lastName, email, status
  // outgoing: contactId or error
  console.log("Adding guest: ", req.body);

  const { eventId, firstName, lastName, email, status } = req.body;
  let error = "";

  if (!eventId || !firstName || !email) {
    error = "Required fields missing.";
    return res.status(400).json({ contactId: -1, error });
  }

  try {
    const db = client.db();
    const guestsCollection = db.collection("Guests");

    // Convert eventId to ObjectId
    let eventIdObj;
    if (ObjectId.isValid(eventId)) {
      eventIdObj = new ObjectId(eventId);
    } else {
      return res.status(400).json({ contactId: -1, error: "Invalid event ID." });
    }

    // Check if the event exists
    const eventsCollection = db.collection("Events");
    const event = await eventsCollection.findOne({ _id: eventIdObj });

    if (!event) {
      error = "Event not found.";
      return res.status(404).json({ contactId: -1, error });
    }

    // Check if contact already exists for this event
    const existingGuest = await guestsCollection.findOne({
      EventID: eventIdObj, // Make sure to match on ObjectId
      Email: email,
    });

    if (existingGuest) {
      error = "Guest with this email already exists for this event.";
      return res.status(400).json({ contactId: -1, error });
    }

    // Create new contact
    const newContact = {
      EventID: eventIdObj, // Store as ObjectId instead of string
      FirstName: firstName,
      LastName: lastName || "",
      Email: email,
      Status: status || "pending",
      CreatedAt: new Date(),
    };

    const result = await guestsCollection.insertOne(newContact);

    res.status(200).json({ contactId: result.insertedId, error: "" });
  } catch (err) {
    console.error("Error adding contact:", err);
    error = "An error occurred while adding the contact.";
    res.status(500).json({ contactId: -1, error });
  }
});


app.post("/api/updateEvent", async (req, res) => {
  console.log("Updating event: ", req.body);

  const { eventId, title, date, time, location, image, description } = req.body;

  if (!eventId) {
    return res.status(400).json({ event: null, error: "Event ID is required." });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");

    let eventIdQuery;
    if (ObjectId.isValid(eventId)) {
      eventIdQuery = new ObjectId(eventId);
    } else {
      return res.status(400).json({ event: null, error: "Invalid Event ID." });
    }

    const updateFields = {
      ...(title && { EventName: title }),
      ...(date && { Date: date }),
      ...(time && { Time: time }),
      ...(location && { Location: location }),
      ...(image !== undefined && { Image: image }),
      ...(description !== undefined && { Description: description }),
      UpdatedAt: new Date(),
    };

    const result = await eventsCollection.updateOne(
      { _id: eventIdQuery },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ event: null, error: "Event not found or no changes made." });
    }

    // Fetch the updated event
    const updatedEvent = await eventsCollection.findOne({ _id: eventIdQuery });

    res.status(200).json({ event: updatedEvent, error: "" });

  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ event: null, error: "An error occurred while updating the event." });
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