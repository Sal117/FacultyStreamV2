import { v4 as uuidv4 } from "uuid"; // For unique request IDs
import { google as googleApis } from "googleapis"; // Use direct import to avoid lazy loading issues
console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log("Google Client Secret:", import.meta.env.VITE_GOOGLE_CLIENT_SECRET);
console.log("Redirect URI:", import.meta.env.VITE_GOOGLE_REDIRECT_URI);

const oauth2Client = new googleApis.auth.OAuth2(
  import.meta.env.VITE_GOOGLE_CLIENT_ID,
  import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  import.meta.env.VITE_GOOGLE_REDIRECT_URI
);

const calendar = googleApis.calendar({ version: "v3", auth: oauth2Client });

export const googleMeetService = {
  /**
   * Generate Google OAuth2 authentication URL.
   */
  getAuthURL: () => {
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
  async getAccessToken(code: string) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error: unknown) {
      console.error(
        "Error fetching access token:",
        error instanceof Error ? error.message : error
      );
      throw new Error("Failed to fetch access token.");
    }
  },

  /**
   * Create a Google Meet event and return the meeting link.
   */
  async createGoogleMeetEvent(eventDetails: {
    summary: string;
    description?: string; // Optional description
    start: string; // ISO format
    end: string; // ISO format
    attendees?: { email: string }[]; // Optional attendees
  }): Promise<string | null> {
    try {
      const requestId = uuidv4(); // Generate unique request ID

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

      console.log("Creating Google Meet event:", event);

      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
        conferenceDataVersion: 1,
      });

      const entryPoints = response.data.conferenceData?.entryPoints;
      const meetLink = entryPoints?.find(
        (entryPoint) =>
          entryPoint.entryPointType === "video" && entryPoint.uri
      )?.uri;

      if (!meetLink) {
        throw new Error("Google Meet link not generated");
      }

      console.log("Google Meet link created successfully:", meetLink);
      return meetLink;
    } catch (error: unknown) {
      console.error(
        "Error creating Google Meet link:",
        error instanceof Error ? error.message : error
      );
      throw new Error("Failed to create Google Meet link. Please try again.");
    }
  },

  /**
   * Fetch events from Google Calendar.
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
    } catch (error: unknown) {
      console.error(
        "Error fetching Google Calendar events:",
        error instanceof Error ? error.message : error
      );
      throw new Error("Failed to fetch Google Calendar events.");
    }
  },
};
