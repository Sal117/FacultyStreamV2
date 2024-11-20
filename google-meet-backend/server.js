const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
require("dotenv").config(); // Load environment variables from .env file
const fs = require("fs");

const app = express();
console.log("Starting the server...");

app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse incoming JSON requests

// Load environment variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Initialize Google Calendar API with OAuth2 authentication
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// Endpoint to handle OAuth2 callback
app.get("/oauth2callback", async (req, res) => {
    const code = req.query.code;
  
    if (!code) {
      return res.status(400).send("Authorization code not provided.");
    }
  
    try {
      const { tokens } = await oauth2Client.getToken(code); // Exchange code for tokens
      oauth2Client.setCredentials(tokens); // Set the credentials for further API requests
  
      console.log("Tokens acquired:", tokens);
  
      // Save tokens to a file (optional)
      const tokenPath = "./tokens.json";
      fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2)); // Save tokens in a JSON file
      console.log(`Tokens saved to ${tokenPath}`);
  
      res.status(200).send("Authorization successful. You can close this tab.");
    } catch (error) {
      console.error("Error exchanging authorization code:", error); // Log full error object
      res.status(500).send("Failed to authorize.");
    }
  });
  

// Endpoint to create a Google Meet event
app.post("/api/create-meeting", async (req, res) => {
  const { summary, description, start, end, attendees } = req.body;

  // Validate the input data
  if (!summary || !start || !end) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const event = {
      summary,
      description: description || "No description provided",
      start: { dateTime: start, timeZone: "Asia/Kuala_Lumpur" },
      end: { dateTime: end, timeZone: "Asia/Kuala_Lumpur" },
      attendees: attendees || [], // Fallback to an empty array if no attendees are provided
      conferenceData: {
        createRequest: {
          requestId: `${Date.now()}`, // Unique request ID for Google Meet creation
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary", // Use the primary Google Calendar
      requestBody: event,
      conferenceDataVersion: 1, // Enable conference data for Google Meet link
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (entryPoint) => entryPoint.entryPointType === "video"
    )?.uri;

    if (!meetLink) throw new Error("Google Meet link not generated");

    res.json({ meetingLink: meetLink });
  } catch (error) {
    console.error("Error creating meeting:", error); // Log full error object
    res
      .status(500)
      .json({ message: "Failed to create meeting", error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
