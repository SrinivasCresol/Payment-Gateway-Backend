require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

require("./Db/Connect");

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

//Payment Gateway Integration

const stripe = new Stripe(process.env.STRIPE_KEY);
app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Invalid request body. It should be an array." });
    }

    const params = {
      submit_type: "pay",
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_options: [{ shipping_rate: "shr_1NpVIBSHnUWkZzn7BB3IhnF4" }],
      line_items: req.body.map((item) => ({
        price_data: {
          currency: "INR",
          product_data: {
            name: item.model,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
        },
      })),
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    };

    const session = await stripe.checkout.sessions.create(params);
    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    let errorMessage = "An error occurred while creating the checkout session.";

    if (err.type === "StripeInvalidRequestError") {
      errorMessage = err.raw.message;
    }

    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
