const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const cors = require("cors")
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express();
app.use(cors())
app.use(express.json())

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyFBToken = async (req,res,next)=>{
const token = req.headers.authorization;

if(!token){
  return res.status(401).send({message:'unauthorize access'})
}

try{

const idToken = token.split(' ')[1]
const decoded = await admin.auth().verifyIdToken(idToken)
console.log("decoded info",decoded)
req.decoded_email = decoded.email
next()
}
  catch(error){
  return res.status(401).send({message:'unauthorize access'})

  }
}





// const admin = require("firebase-admin");

// const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
// const serviceAccount = JSON.parse(decoded);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });


// const verifyFBToken = async (req, res, next) => {
//   const token = req.headers.authorization;

//   if (!token) {
//     return res.status(401).send({ message: "unauthorize access" })
//   }

//   try {
//     const idToken = token.split(' ')[1]
//     const decoded = await admin.auth().verifyIdToken(idToken)
//     console.log('decoded info', decoded)
//     req.decoded_email = decoded.email;
//     next()
//   }
//   catch (error) {
//     return res.status(401).send({ message: 'unauthorize access' })

//   }
// }



const uri = "mongodb+srv://garments_user:9rHacx5v975SerIQ@cluster0.wlngie2.mongodb.net/?appName=Cluster0";



//mongodb
// name: Blood_web 
// pass: BEImVsl9VLRYzkkc




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db('garmentsDB')
    const userCollections = database.collection('user')
    const requestCollection = database.collection('request')






    //user post
    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      userInfo.createdAt = new Date();
      userInfo.role = 'donar'
      userInfo.status = 'active'

      const result = await userCollections.insertOne(userInfo);
      res.send(result)
    })

    app.get('/users',verifyFBToken,async(req,res)=>{
      const result = await userCollections.find().toArray();
      res.status(200).send(result)
    })

    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollections.findOne(query)
      res.send(result)
    })

  app.patch('/update/user/status',verifyFBToken,async(req,res)=>{
    const {email,status} = req.query;
    const query = {email:email}

    const updateStatus = {
      $set:{
        status:status
      }
    }
    const result = await userCollections.updateOne(query,updateStatus)
    res.send(result)
  })



    //products
    app.post('/requests', verifyFBToken, async (req, res) => {
      const data = req.body
      data.createdAt = new Date()
      const result = await requestCollection.insertOne(data)
      res.send(result)
    })


    app.get('/my-request',verifyFBToken, async(req,res)=>{
      const email = req.decoded_email

const size = Number(req,query.size)
const page = Number(req.query.page)
      const query = {requester_email:email}
      const result = await requestCollection.find(query)
      .limit(size)
      .skip(size*page)
      .toArray()

      const totalRequest = await requestCollection.countDocuments(query)
  
      res.send({request:result, totalRequest})
    })
 




























    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





















app.get('/', (req, res) => {
  res.send("server is running")
})

app.listen(port, () => {
  console.log(`server is running on ${port}`);
})