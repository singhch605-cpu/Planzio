const { google } = require('googleapis');

const createOAuth2Client = (tokens) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};

const createMeeting = async (meetingData, userTokens) => {
  const auth = createOAuth2Client(userTokens);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: meetingData.title,
    description: meetingData.agenda,
    start: {
      dateTime: meetingData.startTime,
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: meetingData.endTime,
      timeZone: 'Asia/Kolkata',
    },
    attendees: meetingData.attendees.map(email => ({ email })),
    conferenceData: {
      createRequest: { requestId: Date.now().toString() }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ]
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all'
  });

  return response.data;
};

module.exports = { createMeeting };
