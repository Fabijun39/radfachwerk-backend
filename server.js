import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY ist nicht gesetzt. Bitte .env prüfen.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

app.post("/api/ki-diagnose", async (req, res) => {
  try {
    const problem = req.body.problem;
    if (!problem || typeof problem !== "string") {
      return res
        .status(400)
        .json({ error: "Feld 'problem' fehlt oder ist ungültig." });
    }

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction:
    "Du bist Fabio, ein erfahrener Fahrradmechaniker. Antworte kurz, fachlich versiert und hilfsbereit auf Deutsch (maximal 3 Sätze) Außerdenm habe ich einen Arbeitswert von 80 Euro und gebe dem Kunden eine Grobe Kostenschätung ab.",
});




    const prompt = `Ein Kunde beschreibt sein Problem am Fahrrad: "${problem}". Gib eine kurze technische Einschätzung und ggf. einen Hinweis, ob er zur Werkstatt kommen sollte.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ answer: text });
  } catch (err) {
    console.error("DETAILLIERTER FEHLER:", err);
    return res
      .status(500)
      .json({ error: "Interner Fehler bei der Analyse." });
  }
});

app.listen(port, () => {
  console.log(`RadFachWerk KI-Backend läuft auf Port ${port}`);
});
