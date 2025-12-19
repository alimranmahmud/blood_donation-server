// const { MongoClient, ServerApiVersion } = require('mongodb');
// const express = require('express')
// const cors = require("cors")
// require('dotenv').config()
// const port = process.env.PORT || 5000
// const stripe = require('stripe')(process.env.STRIPE_SECRATE);
// const crypto = require('crypto')

// const app = express();
// app.use(cors())
// app.use(express.json())

// const admin = require("firebase-admin");
// const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
// const serviceAccount = JSON.parse(decoded);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const verifyFBToken = async (req, res, next) => {
//   const token = req.headers.authorization;

//   if (!token) {
//     return res.status(401).send({ message: 'unauthorize access' })
//   }

//   try {

//     const idToken = token.split(' ')[1]
//     const decoded = await admin.auth().verifyIdToken(idToken)
//     console.log("decoded info", decoded)
//     req.decoded_email = decoded.email
//     next()
//   }
//   catch (error) {
//     return res.status(401).send({ message: 'unauthorize access' })

//   }
// }



// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wlngie2.mongodb.net/?appName=Cluster0`;






// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     // await client.connect();

//     const database = client.db('garmentsDB')
//     const userCollections = database.collection('user')
//     const requestCollection = database.collection('request')
//     const paymentCollection = database.collection('payments')






//     //user post
//     app.post('/users', async (req, res) => {
//       const userInfo = req.body;
//       userInfo.createdAt = new Date();
//       userInfo.role = 'donar'
//       userInfo.status = 'active'

//       const result = await userCollections.insertOne(userInfo);
//       res.send(result)
//     })

//     app.get('/users', verifyFBToken, async (req, res) => {
//       const result = await userCollections.find().toArray();
//       res.status(200).send(result)
//     })

//     app.get('/users/role/:email', async (req, res) => {
//       const email = req.params.email;
//       const query = { email: email };
//       const result = await userCollections.findOne(query)
//       res.send(result)
//     })

//     app.patch('/update/user/status', verifyFBToken, async (req, res) => {
//       const { email, status } = req.query;
//       const query = { email: email }

//       const updateStatus = {
//         $set: {
//           status: status
//         }
//       }
//       const result = await userCollections.updateOne(query, updateStatus)
//       res.send(result)
//     })



//     //products
//     app.post('/requests', verifyFBToken, async (req, res) => {
//       const data = req.body
//       data.createdAt = new Date()
//       const result = await requestCollection.insertOne(data)
//       res.send(result)
//     })


//     app.get('/my-request', verifyFBToken, async (req, res) => {
//       const email = req.decoded_email

//       const size = Number(req, query.size)
//       const page = Number(req.query.page)
//       const query = { requester_email: email }
//       const result = await requestCollection.find(query)
//         .limit(size)
//         .skip(size * page)
//         .toArray()

//       const totalRequest = await requestCollection.countDocuments(query)

//       res.send({ request: result, totalRequest })
//     })

//     app.get('/search-requests', async (req, res) => {
//       const { bloodGroup, district, upazila } = req.query;


//       const query = {}
//       if (!query) {
//         return
//       }

//       if (bloodGroup) {
//         const fixed = bloodGroup.replace(/ /g, "+").trim()
//         query.blood_group = fixed
//       }

//       if (district) {
//         query.recipient_district = district
//       }

//       if (upazila) {
//         query.recipient_upazila = upazila
//       }

//       const result = await requestCollection.find(query).toArray()
//       res.send(result)

//       res.send({
//         success: true,
//         data: { bloodGroup, district, upazila }
//       });
//     });


// ////////////////////////////////////////////////////////////////


// //1
// const { ObjectId } = require("mongodb");

// const verifyAdminOrVolunteer = async (req, res, next) => {
//   const email = req.decoded_email;

//   const user = await userCollections.findOne({ email });

//   if (user?.role === 'admin' || user?.role === 'volunteer') {
//     next();
//   } else {
//     return res.status(403).send({ message: 'Forbidden access' });
//   }
// };

// //2
// app.get(
//   '/donation-requests',
//   verifyFBToken,
//   verifyAdminOrVolunteer,
//   async (req, res) => {
//     const result = await requestCollection.find().toArray();
//     res.send(result);
//   }
// );


// //3
// app.patch(
//   '/donation-requests/:id/status',
//   verifyFBToken,
//   verifyAdminOrVolunteer,
//   async (req, res) => {
//     const { id } = req.params;
//     const { status, donor } = req.body;

//     const allowedStatus = ['pending', 'inprogress', 'done', 'canceled'];
//     if (!allowedStatus.includes(status)) {
//       return res.status(400).send({ message: 'Invalid status' });
//     }

//     const updateDoc = {
//       $set: { status }
//     };

//     if (status === 'inprogress') {
//       updateDoc.$set.donor = donor;
//     }

//     const result = await requestCollection.updateOne(
//       { _id: new ObjectId(id) },
//       updateDoc
//     );

//     res.send(result);
//   }
// );






// /////////////////////////////////////////////////////////////////
//     //payment
//     app.post('/create-payment-checkout', async (req, res) => {
//       try {
//         const information = req.body;

//         const amount = Number(information.donateAmount) * 100;

//         if (!amount || amount <= 0) {
//           return res.status(400).send({ message: 'Invalid donation amount' });
//         }

//         const session = await stripe.checkout.sessions.create({
//           payment_method_types: ['card'],
//           line_items: [
//             {
//               price_data: {
//                 currency: 'usd',
//                 unit_amount: amount,
//                 product_data: {
//                   name: 'Please Donate'
//                 }
//               },
//               quantity: 1
//             }
//           ],
//           mode: 'payment',
//           metadata: {
//             donorName: information?.donorName || 'Anonymous'
//           },
//           customer_email: information.donorEmail,
//           success_url: `${process.env.SITE_DOMAIN}payment-success?session_id={CHECKOUT_SESSION_ID}`,
//           cancel_url: `${process.env.SITE_DOMAIN}/payment-cancelled`
//         });

//         res.send({ url: session.url });

//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: error.message });
//       }
//     });

//     app.post('/success-payment', async (req, res) => {
//       const { session_id } = req.query;
//       const session = await stripe.checkout.sessions.retrieve(
//         session_id
//       )
//       const transactionId = session.payment_intent;

//       const isPaymentExist = await paymentCollection.findOne({ transactionId })
//       if (isPaymentExist) {
//         return
//       }

//       if (session.payment_status == 'paid') {
//         const paymentInfo = {
//           amount: session.amount_total / 100,
//           currency: session.currency,
//           donorEmail: session.customer_email,
//           transactionId,
//           payment_status: session.payment_status,
//           paidAt: new Date()

//         }
//         const result = await paymentCollection.insertOne(paymentInfo)
//         return res.send(result)
//       }
//     })



























//     // Send a ping to confirm a successful connection
//     // await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);





















// app.get('/', (req, res) => {
//   res.send("server is running")
// })

// app.listen(port, () => {
//   console.log(`server is running on ${port}`);
// })


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require("cors");
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRATE);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------------- FIREBASE ADMIN ----------------
const admin = require("firebase-admin");
const decodedKey = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decodedKey);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyFBToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
};

// ---------------- MONGODB ----------------
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wlngie2.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db('garmentsDB');
    const userCollections = database.collection('user');
    const requestCollection = database.collection('request');
    const paymentCollection = database.collection('payments');

    // ---------------- ROLE MIDDLEWARE ----------------
    const verifyAdminOrVolunteer = async (req, res, next) => {
      const user = await userCollections.findOne({ email: req.decoded_email });
      if (user?.role === 'admin' || user?.role === 'volunteer') {
        next();
      } else {
        res.status(403).send({ message: 'Forbidden access' });
      }
    };

    const verifyAdmin = async (req, res, next) => {
      const user = await userCollections.findOne({ email: req.decoded_email });
      if (user?.role === 'admin') {
        next();
      } else {
        res.status(403).send({ message: 'Admin only access' });
      }
    };

    // ---------------- USERS ----------------
    app.post('/users', async (req, res) => {
      const userInfo = {
        ...req.body,
        createdAt: new Date(),
        role: 'donor',
        status: 'active'
      };
      const result = await userCollections.insertOne(userInfo);
      res.send(result);
    });

    app.get('/users', verifyFBToken, verifyAdmin, async (req, res) => {
      const result = await userCollections.find().toArray();
      res.send(result);
    });

    app.get('/users/role/:email', async (req, res) => {
      const result = await userCollections.findOne({ email: req.params.email });
      res.send(result);
    });

    app.patch('/update/user/status', verifyFBToken, verifyAdmin, async (req, res) => {
      const { email, status } = req.query;
      const result = await userCollections.updateOne(
        { email },
        { $set: { status } }
      );
      res.send(result);
    });

    // ---------------- DONATION REQUESTS ----------------
    app.post('/requests', verifyFBToken, async (req, res) => {
      const data = {
        ...req.body,
        createdAt: new Date(),
        status: 'pending'
      };
      const result = await requestCollection.insertOne(data);
      res.send(result);
    });

    // app.get('/my-request', verifyFBToken, async (req, res) => {
    //   const size = Number(req.query.size) || 10;
    //   const page = Number(req.query.page) || 0;

    //   const query = { requester_email: req.decoded_email };
    //   const result = await requestCollection.find(query)
    //     .skip(page * size)
    //     .limit(size)
    //     .toArray();

    //   const totalRequest = await requestCollection.countDocuments(query);
    //   res.send({ request: result, totalRequest });
    // });
app.get('/my-request', verifyFBToken, async (req, res) => {
  const size = Number(req.query.size) || 5;
  const page = Number(req.query.page) || 0;

  const query = { requesterEmail: req.decoded_email };

  const result = await requestCollection
    .find(query)
    .sort({ createdAt: -1 })
    .skip(page * size)
    .limit(size)
    .toArray();

  const totalRequest = await requestCollection.countDocuments(query);

  res.send({ request: result, totalRequest });
});

    app.get('/donation-requests', verifyFBToken, verifyAdminOrVolunteer, async (req, res) => {
      const result = await requestCollection.find().toArray();
      res.send(result);
    });

    app.patch('/donation-requests/:id/status', verifyFBToken, verifyAdminOrVolunteer, async (req, res) => {
      const { status, donor } = req.body;

      const allowedStatus = ['pending', 'inprogress', 'done', 'canceled'];
      if (!allowedStatus.includes(status)) {
        return res.status(400).send({ message: 'Invalid status' });
      }

      const updateDoc = { $set: { status } };
      if (status === 'inprogress') {
        updateDoc.$set.donor = donor;
      }

      const result = await requestCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        updateDoc
      );
      res.send(result);
    });

    // ---------------- SEARCH (PUBLIC) ----------------
    app.get('/search-requests', async (req, res) => {
      const { bloodGroup, district, upazila } = req.query;
      const query = {};

      if (bloodGroup) query.bloodGroup = bloodGroup.replace(/ /g, "+").trim();
      if (district) query.district = district;
      if (upazila) query.upazila = upazila;

      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });

    // ---------------- PAYMENT ----------------
    app.post('/create-payment-checkout', async (req, res) => {
      const amount = Number(req.body.donateAmount) * 100;
      if (!amount || amount <= 0) {
        return res.status(400).send({ message: 'Invalid donation amount' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: { name: 'Blood Donation Fund' }
          },
          quantity: 1
        }],
        mode: 'payment',
        customer_email: req.body.donorEmail,
        success_url: `${process.env.SITE_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/payment-cancelled`
      });

      res.send({ url: session.url });
    });

    app.post('/success-payment', async (req, res) => {
      const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

      const exists = await paymentCollection.findOne({ transactionId: session.payment_intent });
      if (exists) return res.send({ message: 'Already saved' });

      if (session.payment_status === 'paid') {
        const paymentInfo = {
          amount: session.amount_total / 100,
          donorEmail: session.customer_email,
          transactionId: session.payment_intent,
          paidAt: new Date()
        };
        const result = await paymentCollection.insertOne(paymentInfo);
        res.send(result);
      }
    });

    console.log("✅ MongoDB connected successfully");
  } finally {}
}

run().catch(console.dir);

// ---------------- ROOT ----------------
app.get('/', (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
