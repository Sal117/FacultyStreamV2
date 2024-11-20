import { v4 as uuidv4 } from "uuid";
import { google as googleApis } from "googleapis";

console.log("Google Client ID: 370816278537-tt6hsmq2oqdckv8kneumjsqamlkevvha.apps.googleusercontent.com");
console.log("Google Client Secret: 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");
console.log("Redirect URI: http://localhost:5000/oauth2callback");

const oauth2Client = new googleApis.auth.OAuth2(
  "370816278537-tt6hsmq2oqdckv8kneumjsqamlkevvha.apps.googleusercontent.com",
  "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",
  "http://localhost:5000/oauth2callback"
);

const calendar = googleApis.calendar({ version: "v3", auth: oauth2Client });

export const googleMeetService = {
  /**
   * Generate Google OAuth2 authentication URL.
   */
  getAuthURL: (): string => {
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar",
    ];
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
  },

  /**
   * Exchange authorization code for access tokens.
   */
  async getAccessToken(code: string): Promise<any> {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      console.log("Access token acquired:", tokens);
      return tokens;
    } catch (error) {
      console.error("Error fetching access token:", (error as Error).message);
      throw new Error("Failed to fetch access token.");
    }
  },

  /**
   * Create a Google Meet event and return the meeting link.
   */
  async createGoogleMeetEvent(eventDetails: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    attendees?: { email: string }[];
  }): Promise<string | null> {
    try {
      const requestId = uuidv4();

      const event = {
        summary: eventDetails.summary,
        description: eventDetails.description || "No description provided",
        start: {
          dateTime: eventDetails.start,
          timeZone: "Asia/Kuala_Lumpur",
        },
        end: {
          dateTime: eventDetails.end,
          timeZone: "Asia/Kuala_Lumpur",
        },
        attendees: eventDetails.attendees || [],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        conferenceDataVersion: 1,
      });

      const meetLink = response.data.conferenceData?.entryPoints?.find(
        (entryPoint) =>
          entryPoint.entryPointType === "video" && entryPoint.uri
      )?.uri;

      if (!meetLink) {
        throw new Error("Google Meet link not generated");
      }

      console.log("Google Meet link created successfully:", meetLink);
      return meetLink;
    } catch (error) {
      console.error(
        "Error creating Google Meet link:",
        (error as Error).message
      );
      throw new Error("Failed to create Google Meet link. Please try again.");
    }
  },

  /**
   * Fetch upcoming events from Google Calendar.
   */
  async fetchEvents(): Promise<any[]> {
    try {
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];
      console.log("Fetched events from Google Calendar:", events);
      return events;
    } catch (error) {
      console.error(
        "Error fetching Google Calendar events:",
        (error as Error).message
      );
      throw new Error("Failed to fetch Google Calendar events.");
    }
  },
};
