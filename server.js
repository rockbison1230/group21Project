const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());


const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const url = process.env.MONGODB_URI;
const client = new MongoClient(url);
async function connectDB()
{
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(); // Use the default database connection
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections); // Logs all collections in the database
    
    // Optionally, verify the 'Users' collection exists
    if (!collections.some(collection => collection.name === 'Users')) {
      console.log('Users collection not found');
    } else {
      console.log('Users collection found');
    }
  }
  catch {
    console.error('Error connecting to MongoDB:', error);
  }
}
connectDB();

app.post('/api/login', async (req, res, next) =>
  {
    // incoming: login, password
    // outgoing: id, firstName, lastName, email, error
    console.log('Request data: ', req.body);
    var error = '';
    const { login, password } = req.body;
    const db = client.db();
    const results = await
    db.collection('Users').find({Username:login, Password:password}).toArray();
    var id = -1;
    var fn = '';
    var ln = '';
    var email = '';
    if( results.length > 0 )
    {
      id = results[0]._id;
      fn = results[0].FirstName;
      ln = results[0].LastName;
      email = results[0].Email;
    }
    var ret = { id:id, firstName:fn, lastName:ln, email: email, error:''};
    res.status(200).json(ret);
  });

app.post('/api/addcard', async (req, res, next) =>
    {
      // incoming: userId, color
      // outgoing: error
    
      var error = '';
    
      const { userId, card } = req.body;
    
      // TEMP FOR LOCAL TESTING.
      cardList.push( card );
    
      var ret = { error: error };
      res.status(200).json(ret);
    });
    
    app.post('/api/searchcards', async (req, res, next) => 
    {
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
    

app.use((req, res, next) =>
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS'
    );
    next();
});

app.listen(5000); // start Node + Express server on port 5000