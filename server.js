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

// Konstante für deinen Arbeitswert
const AW_EURO = 8; // 8 € pro AW

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
      systemInstruction: `
Du bist ein erfahrener Zweiradmechaniker in einer kleinen Fahrradwerkstatt im Hunsrück.
Der Nutzer beschreibt ein Problem an seinem Fahrrad.

Antworte immer auf Deutsch und richte dich an Kundinnen und Kunden, nicht an andere Mechaniker.

Struktur deiner Antwort IMMER in drei Abschnitten mit klaren Überschriften:

1. Vermutete Fehlerdiagnose
   - 2–4 mögliche Ursachen in einfachen Sätzen.

2. Empfohlene Arbeiten in der Fahrradwerkstatt
   - Stichpunktartige Beschreibung typischer Arbeitsschritte
     (z.B. "Bremsbeläge prüfen und ggf. ersetzen", "Schaltzug ersetzen und Schaltung neu einstellen").

3. Grobe Einschätzung für Inspektion & Arbeitsaufwand
   - Schätze eine SPANNE an Arbeitswerten (z.B. "ca. 3–6 AW").
   - Rechne diese Spanne mit einem Arbeitswert von 8 € pro AW in eine grobe, unverbindliche Kostenspanne um
     (z.B. "entspricht etwa 24–48 € Arbeitslohn, ohne Teile").
   - Betone ausdrücklich, dass die endgültige Einschätzung erst nach Sichtprüfung in der Werkstatt möglich ist.

WICHTIG:
- Nenne nur Spannen ("ca.", "etwa") und keine festen, verbindlichen Preise.
- Erwähne immer, dass Ersatzteile und ggf. zusätzliche Arbeiten noch dazukommen können.
- Wecke keine falschen Erwartungen – bei Unsicherheit musst du erwähnen,
  dass eine persönliche Inspektion in der Werkstatt RadFachWerk in Dörrebach nötig ist.

Verwende, wo es sinnvoll ist, Begriffe wie Fahrradreparatur, Fehlerdiagnose und Inspektion,
aber nur natürlich im Text, nicht künstlich gehäuft.
      `.trim(),
    });

    const prompt = `
Ein Kunde hat folgendes Problem mit seinem Fahrrad beschrieben:
"${problem}"

Gehe davon aus, dass es sich um ein normales Alltagsrad oder E‑Bike handeln kann.
Antworte gemäß der vorgegebenen Struktur mit den drei Abschnitten:
"Vermutete Fehlerdiagnose", "Empfohlene Arbeiten in der Fahrradwerkstatt"
und "Grobe Einschätzung für Inspektion & Arbeitsaufwand".

Berücksichtige bei der Kostenspanne, dass ein Arbeitswert (AW) 8 € kostet.
Gib die Kostenspanne immer deutlich als unverbindliche Schätzung an
(z.B. "ca." / "etwa" und "ohne Teile").
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ answer: text, awEuro: AW_EURO });
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
