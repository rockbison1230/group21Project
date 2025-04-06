const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const { ObjectId } = require("mongodb");
const twilio = require("twilio");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

// Send invite to all guests associated with the eventId
app.post("/api/invite", async (req, res) => {
  const { eventId } = req.body;

  console.log("Sending invites for eventId:", eventId);

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required." });
  }

  try {
    const db = client.db();
    const guestsCollection = db.collection("Guests");

    // Get all guests associated with the given eventId
    const guests = await guestsCollection
      .find({ EventID: new ObjectId(eventId) })
      .toArray();

    if (guests.length === 0) {
      return res.status(404).json({ error: "No guests found for this event." });
    }

    // Send SMS to each guest
    const sendInvitesPromises = guests.map(async (guest) => {
      const phoneNumber = guest.Phone;
      const guestName = `${guest.FirstName} ${guest.LastName}`;

      // Generate the RSVP link
      const rsvpLink = `http://espressoevents.xyz/rsvp?eventId=${eventId}&guestId=${guest._id}`;
      
      // Include the RSVP link in the message
      const message = `Hello ${guestName}, you are invited to an event! To RSVP, please click here: ${rsvpLink}`;

      try {
        const messageResponse = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });

        console.log(`Message sent to ${phoneNumber}: ${messageResponse.sid}`);
        return { phoneNumber, status: "success" };
      } catch (error) {
        console.error("Error sending message to", phoneNumber, error);
        return { phoneNumber, status: "error", error: error.message };
      }
    });

    // Wait for all messages to be sent
    const results = await Promise.all(sendInvitesPromises);

    // Check if any errors occurred
    const failedMessages = results.filter((result) => result.status === "error");

    if (failedMessages.length > 0) {
      return res.status(500).json({
        success: false,
        message: "Some invitations failed to send.",
        failedMessages,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invitations sent successfully.",
      results,
    });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return res.status(500).json({ error: "An error occurred while sending invitations." });
  }
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

    // Find all events for this user
    const events = await eventsCollection
      .find({ HostID: userId.toString() }) // Changed to HostID
      .toArray();

    // For each event, get its guests
    const eventsWithGuests = await Promise.all(
      events.map(async (event) => {
        const guestsCollection = db.collection("Guests"); // Changed to Guests
        const guests = await guestsCollection
          .find({ EventID: event._id.toString() }) // Changed to EventID
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

    const newEvent = {
      HostID: userId.toString(), // Changed to HostID
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

// // Update event
// app.post("/api/updateEvent", async (req, res) => {
//   // incoming: eventId, title, date, time, location, image, description
//   // outgoing: success message or error
//   console.log("Updating event: ", req.body);

//   const { eventId, title, date, time, location, image, description } = req.body;
//   let error = "";

//   if (!eventId || !title || !date || !time || !location) {
//     error = "Required fields missing.";
//     return res.status(400).json({ success: false, error });
//   }

//   try {
//     const db = client.db();
//     const eventsCollection = db.collection("Events");

//     // Update the event
//     const updateResult = await eventsCollection.updateOne(
//       { _id: new ObjectId(String(eventId)) },
//       {
//         $set: {
//           Title: title,
//           Date: date,
//           Time: time,
//           Location: location,
//           Image: image || "📅" || "",
//           Description: description || "",
//           UpdatedAt: new Date(),
//         },
//       }
//     );

//     if (updateResult.matchedCount === 0) {
//       error = "Event not found.";
//       return res.status(404).json({ success: false, error });
//     }

//     res.status(200).json({ success: true, error: "" });
//   } catch (err) {
//     console.error("Error updating event:", err);
//     error = "An error occurred while updating the event.";
//     res.status(500).json({ success: false, error });
//   }
// });

// Delete event
app.post("/api/deleteEvent", async (req, res) => {
  console.log("Deleting event: ", req.body);

  const { eventId } = req.body; // Added userId
  let error = "";

  if (!eventId) {
    return res.status(400).json({ success: false, error: "Event ID is required." });
  }

  try {
    const db = client.db();
    const eventsCollection = db.collection("Events");
    const contactsCollection = db.collection("Guests");
    const count = contactsCollection.countDocuments();
    console.log(`Guest collection size: ${count}`);

    // Delete the event
    const deleteResult = await eventsCollection.deleteOne({
      _id: new ObjectId(eventId),
    });
    
    if (deleteResult.deletedCount === 0) {
      error = "Event not found.";
      return res.status(404).json({ success: false, error });
    }
    
    // Delete all contacts associated with this event
    const deletedGuests = await contactsCollection.deleteMany({ EventId: eventId, });
    console.log(deletedGuests.deletedCount);

    res.status(200).json({ success: true, error: "" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ success: false, error: "An error occurred while deleting the event." });
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
    const existingGuest = await guestsCollection.findOne({
      EventId: eventId.toString(),
      Email: email,
    });

    if (existingGuest) {
      error = "Guest with this email already exists for this event.";
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

    const result = await guestsCollection.insertOne(newContact);

    res.status(200).json({ contactId: result.insertedId, error: "" });
  } catch (err) {
    console.error("Error adding contact:", err);
    error = "An error occurred while adding the contact.";
    res.status(500).json({ contactId: -1, error });
  }
});
// // Add contact to event
// app.post("/api/addContact", async (req, res) => {
//   // incoming: eventId, firstName, lastName, email, status
//   // outgoing: contactId or error
//   console.log("Adding contact: ", req.body);

//   const { eventId, firstName, lastName, email, status } = req.body;
//   let error = "";

//   if (!eventId || !firstName || !email) {
//     error = "Required fields missing.";
//     return res.status(400).json({ contactId: -1, error });
//   }

//   try {
//     const db = client.db();
//     const contactsCollection = db.collection("Contacts");

//     // Check if the event exists
//     const eventsCollection = db.collection("Events");
//     const event = await eventsCollection.findOne({
//       _id: new ObjectId(eventId),
//     });

//     if (!event) {
//       error = "Event not found.";
//       return res.status(404).json({ contactId: -1, error });
//     }

//     // Check if contact already exists for this event
//     const existingContact = await contactsCollection.findOne({
//       EventId: eventId.toString(),
//       Email: email,
//     });

//     if (existingContact) {
//       error = "Contact with this email already exists for this event.";
//       return res.status(400).json({ contactId: -1, error });
//     }

//     // Create new contact
//     const newContact = {
//       EventId: eventId.toString(),
//       FirstName: firstName,
//       LastName: lastName || "",
//       Email: email,
//       Status: status || "pending",
//       CreatedAt: new Date(),
//     };

//     const result = await contactsCollection.insertOne(newContact);

//     res.status(200).json({ contactId: result.insertedId, error: "" });
//   } catch (err) {
//     console.error("Error adding contact:", err);
//     error = "An error occurred while adding the contact.";
//     res.status(500).json({ contactId: -1, error });
//   }
// });

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
        { Phone: new RegExp(search, "i") },
      ] } : {})
    };

    const results = await contactsCollection.find(query).toArray();

    const contacts = results.map((contact) => ({
      id: contact._id,
      eventId: contact.EventID,
      name: `${contact.FirstName} ${contact.LastName}`.trim(),
      phone: contact.Phone || "",
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
  console.log("Updating guest status: ", req.query);

  const { guestId, status } = req.query;
  let error = "";

  if (!guestId || !status) {
    return res.status(400).json({ success: false, error: "Guest ID, and Status are required." });
  }

  try {
    const db = client.db();
    const guestsCollection = db.collection("Guests");

    const updateResult = await guestsCollection.updateOne(
      { _id: new ObjectId(guestId) },
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
    /*
    let eventObjectId;
    let guestObjectId;
    try {
      eventObjectId = new ObjectId(eventId);
      guestObjectId = new ObjectId(guestId);
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid Event ID or Guest ID." });
    }

    const db = client.db();
    const guestsCollection = db.collection("Guests");

    // Check if the guest exists for this event
    const guest = await guestsCollection.findOne({
      _id: guestObjectId,
      EventID: eventId.toString(),
    });

    if (!guest) {
      return res.status(404).json({ success: false, error: "Guest not found for this event." });
    }

    // Update the guest status and add UpdatedAt
    const updateResult = await guestsCollection.updateOne(
      { _id: guestObjectId, EventID: eventId.toString() },
      { $set: { Status: status, UpdatedAt: new Date() } } // Added UpdatedAt
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ success: false, error: "Failed to update guest status." });
    }

    res.status(200).json({ success: true, error: "" });
    */
  } catch (err) {
    console.error("Error updating guest status:", err);
    res.status(500).json({ success: false, error: "An error occurred while updating the guest status." });
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
app.get('/api/verify', async (req, res) => {
  // Incoming: verificationToken
  // Outgoing: success message or error message
  const { token } = req.body;
  console.log("api reached");
  const db = client.db();
  const usersCollection = db.collection("Users");

  const user = await usersCollection.findOne({ verificationToken: token});

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
})

app.post('/api/sendGuestInvite', async (req, res) => {
  const { guestId, email } = req.body;

  if (!email || !guestId) return res.status(400).json({ error: "missing email field"});

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const approveUrl = `http://localhost:5001/api/updateGuestStatus?guestId=${guestId}&status=1`;
    const rejectUrl = `http://localhost:5001/api/updateGuestStatus?guestId=${guestId}&status=0`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Please RSVP here!',
      html: `
        <h3>Will You Attend?</h3>
        <a href="${approveUrl}" style="padding:10px 20px;background:green;color:white;text-decoration:none;border-radius:5px;">Yes!</a>
        &nbsp;
        <a href="${rejectUrl}" style="padding:10px 20px;background:red;color:white;text-decoration:none;border-radius:5px;">No</a>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email successful'});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'email failed'});
  }
})


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