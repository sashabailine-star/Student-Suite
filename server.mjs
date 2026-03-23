import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt." });
    }

    const response = await client.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "system",
          content: "You are a helpful student productivity assistant inside a school platform. Be clear, concise, and supportive."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    res.json({ reply: response.output_text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI helper failed." });
  }
});

app.listen(port, () => {
  console.log(`AI helper server running at http://localhost:${port}`);
});