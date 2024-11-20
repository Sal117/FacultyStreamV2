const { googleMeetService } = require('./dist/googleMeetService'); // Ensure the import path matches the project structure
const readline = require("readline");

async function authenticateAndTestGoogleMeet() {
  console.log("Testing Google Meet Service...");

  // Step 1: Generate Auth URL
  const authURL = googleMeetService.getAuthURL();
  console.log("Generated Auth URL:", authURL);

  // Step 2: Prompt user to visit Auth URL and paste the authorization code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Visit the URL above and paste the authorization code here: ", async (code) => {
    rl.close();

    try {
      // Step 3: Exchange authorization code for access token
      const tokens = await googleMeetService.getAccessToken(code);
      console.log("Tokens acquired successfully:", tokens);

      // Step 4: Test creating a Google Meet event
      const meetingLink = await googleMeetService.createGoogleMeetEvent({
        summary: "Test Meeting",
        description: "This is a test meeting created for verification purposes.",
        start: new Date().toISOString(),
        end: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes duration
        attendees: [{ email: "testuser@example.com" }], // Add test attendee email
      });

      console.log("Generated Google Meet Link:", meetingLink);
    } catch (error) {
      console.error("Error during Google Meet Service test:", error); // Log full error for debugging
    }
  });
}

// Run the test
authenticateAndTestGoogleMeet();
