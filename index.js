const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const cors = require("cors")
require('dotenv').config()
const port = process.env.PORT || 5000
const stripe = require('stripe')(process.env.STRIPE_SECRATE);
const crypto = require('crypto')

const app = express();
app.use(cors())
app.use(express.json())

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const verifyFBToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ message: 'unauthorize access' })
  }

  try {

    const idToken = token.split(' ')[1]
    const decoded = await admin.auth().verifyIdToken(idToken)
    console.log("decoded info", decoded)
    req.decoded_email = decoded.email
    next()
  }
  catch (error) {
    return res.status(401).send({ message: 'unauthorize access' })

  }
}



const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wlngie2.mongodb.net/?appName=Cluster0`;






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
    // await client.connect();

    const database = client.db('garmentsDB')
    const userCollections = database.collection('user')
    const requestCollection = database.collection('request')
    const paymentCollection = database.collection('payments')









    //user post
    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      userInfo.createdAt = new Date();
      userInfo.role = 'donar'
      userInfo.status = 'active'

      const result = await userCollections.insertOne(userInfo);
      res.send(result)
    })

    app.get('/users', verifyFBToken, async (req, res) => {
      const result = await userCollections.find().toArray();
      res.status(200).send(result)
    })

    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollections.findOne(query)
      res.send(result)
    })

    app.patch('/update/user/status', verifyFBToken, async (req, res) => {
      const { email, status } = req.query;
      const query = { email: email }

      const updateStatus = {
        $set: {
          status: status
        }
      }
      const result = await userCollections.updateOne(query, updateStatus)
      res.send(result)
    })



    //products
    app.post('/requests', verifyFBToken, async (req, res) => {
      const data = req.body
      data.createdAt = new Date()
      const result = await requestCollection.insertOne(data)
      res.send(result)
    })



    app.get('/my-request', verifyFBToken, async (req, res) => {
      try {
        const email = req.decoded_email;

        const size = Number(req.query.size) || 10;
        const page = Number(req.query.page) || 0;

        const query = { requester_email: email };

        const result = await requestCollection
          .find(query)
          .skip(page * size)
          .limit(size)
          .toArray();

        const totalRequest = await requestCollection.countDocuments(query);

        res.send({ request: result, totalRequest });

      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });


    //

    app.get('/search-requests', async (req, res) => {
      const { bloodGroup, district, upazila } = req.query;


      const query = {}
      if (!query) {
        return
      }

      if (bloodGroup) {
        const fixed = bloodGroup.replace(/ /g, "+").trim()
        query.blood_group = fixed
      }

      if (district) {
        query.recipient_district = district
      }

      if (upazila) {
        query.recipient_upazila = upazila
      }

      const result = await requestCollection.find(query).toArray()
      res.send(result)

      res.send({
        success: true,
        data: { bloodGroup, district, upazila }
      });
    });


    //payment
    app.post('/create-payment-checkout', async (req, res) => {
      try {
        const information = req.body;

        const amount = Number(information.donateAmount) * 100;

        if (!amount || amount <= 0) {
          return res.status(400).send({ message: 'Invalid donation amount' });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                unit_amount: amount,
                product_data: {
                  name: 'Please Donate'
                }
              },
              quantity: 1
            }
          ],
          mode: 'payment',
          metadata: {
            donorName: information?.donorName || 'Anonymous'
          },
          customer_email: information.donorEmail,
          success_url: `${process.env.SITE_DOMAIN}payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.SITE_DOMAIN}/payment-cancelled`
        });

        res.send({ url: session.url });

      } catch (error) {
        console.error(error);
        res.status(500).send({ error: error.message });
      }
    });

    app.post('/success-payment', async (req, res) => {
      const { session_id } = req.query;
      const session = await stripe.checkout.sessions.retrieve(
        session_id
      )
      const transactionId = session.payment_intent;

      const isPaymentExist = await paymentCollection.findOne({ transactionId })
      if (isPaymentExist) {
        return
      }

      if (session.payment_status == 'paid') {
        const paymentInfo = {
          amount: session.amount_total / 100,
          currency: session.currency,
          donorEmail: session.customer_email,
          transactionId,
          payment_status: session.payment_status,
          paidAt: new Date()

        }
        const result = await paymentCollection.insertOne(paymentInfo)
        return res.send(result)
      }
    })



    ////////////////////////////////

    const { ObjectId } = require("mongodb");

    const verifyAdminOrVolunteer = async (req, res, next) => {
      const email = req.decoded_email;

      const user = await userCollections.findOne({ email });

      if (user?.role === "admin" || user?.role === "volunteer") {
        next();
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    };


    // 🔹 Get all donation requests (Admin / Volunteer)
    app.get(
      "/donation-requests",
      verifyFBToken,
      verifyAdminOrVolunteer,
      async (req, res) => {
        const result = await requestCollection.find().sort({ createdAt: -1 }).toArray();

        // 🔁 frontend-friendly field mapping
        const formatted = result.map(item => ({
          _id: item._id,
          recipientName: item.recipient_name,
          district: item.recipient_district,
          upazila: item.recipient_upazila,
          hospital: item.hospital_name,
          bloodGroup: item.blood_group,
          donationDate: item.createdAt,
          status: item.donation_status || "pending"
        }));

        res.send(formatted);
      }
    );


    app.patch(
      "/donation-requests/:id/status",
      verifyFBToken,
      verifyAdminOrVolunteer,
      async (req, res) => {
        const { id } = req.params;
        const { status, donor } = req.body;

        const allowedStatus = ["pending", "inprogress", "done", "canceled"];
        if (!allowedStatus.includes(status)) {
          return res.status(400).send({ message: "Invalid status" });
        }

        const updateDoc = {
          $set: {
            donation_status: status
          }
        };

        if (status === "inprogress") {
          updateDoc.$set.assigned_donor = donor;
        }

        const result = await requestCollection.updateOne(
          { _id: new ObjectId(id) },
          updateDoc
        );

        res.send(result);
      }
    );











    ///////////////////////////////////


    // 🔍 PUBLIC SEARCH BLOOD REQUESTS
    app.get('/search-requests', async (req, res) => {
      try {
        const { bloodGroup, district, upazila } = req.query;

        const query = {};

        if (bloodGroup) {
          query.blood_group = bloodGroup;
        }

        if (district) {
          query.recipient_district = district;
        }

        if (upazila) {
          query.recipient_upazila = upazila;
        }

        const result = await requestCollection
          .find(query)
          .sort({ createdAt: -1 }) // latest first
          .toArray();

        res.send(result);

      } catch (error) {
        console.error("Search error:", error);
        res.status(500).send({ message: "Server error" });
      }
    });




























    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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