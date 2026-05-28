require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {

  try {

    const msg =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!msg) {
      return res.sendStatus(200);
    }

    const userMessage = msg.text?.body || "";

    const gemini = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text:
`You are SiteLab India AI assistant.

Services:
- Websites
- Landing pages
- SEO
- Website updates

Keep replies short, useful, professional.

Customer: ${userMessage}`
              }
            ]
          }
        ]
      }
    );

    const reply =
      gemini.data.candidates[0].content.parts[0].text;

    await axios.post(
      `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: msg.from,
        text: { body: reply }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
        }
      }
    );

    res.sendStatus(200);

  } catch (e) {
    console.log(e.response?.data || e.message);
    res.sendStatus(500);
  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("running...");
});
