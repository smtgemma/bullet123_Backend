
import httpStatus from "http-status";
import axios from "axios";
import { google } from "googleapis";
import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import { MeetingStatus } from "@prisma/client";

const getZoomToken = async (): Promise<string> => {
  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {},
    {
      auth: {
        username: process.env.ZOOM_CLIENT_ID as string,
        password: process.env.ZOOM_CLIENT_SECRET as string,
      },
    }
  );
  return response.data.access_token;
};


const getGoogleCalendarClient = () => {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
};

const createCalendarEvent = async (data: {
  topic: string;
  startTime: string;
  duration: number;
  timezone: string;
  joinUrl: string;
  attendeeEmail?: string;
}) => {
  const calendar = getGoogleCalendarClient();

  const startDateTime = new Date(data.startTime);
  const endDateTime = new Date(startDateTime.getTime() + data.duration * 60000);

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    requestBody: {
      summary: data.topic,
      description: `Join Zoom Meeting: ${data.joinUrl}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: data.timezone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: data.timezone,
      },
      // Add attendee if email provided
      attendees: data.attendeeEmail
        ? [{ email: data.attendeeEmail }]
        : [],
      // Add Zoom link as conference
      conferenceData: {
        entryPoints: [
          {
            entryPointType: "video",
            uri: data.joinUrl,
            label: "Join Zoom Meeting",
          },
        ],
      },
    },
  });

  return event.data.id; // Returns Google Calendar event ID
};


const updateCalendarEvent = async (
  eventId: string,
  data: {
    topic?: string;
    startTime?: string;
    duration?: number;
    timezone?: string;
  }
) => {
  const calendar = getGoogleCalendarClient();

  const updateData: any = {};

  if (data.topic) updateData.summary = data.topic;

  if (data.startTime && data.duration) {
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(
      startDateTime.getTime() + data.duration * 60000
    );
    updateData.start = {
      dateTime: startDateTime.toISOString(),
      timeZone: data.timezone,
    };
    updateData.end = {
      dateTime: endDateTime.toISOString(),
      timeZone: data.timezone,
    };
  }

  await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    eventId,
    requestBody: updateData,
  });
};


const deleteCalendarEvent = async (eventId: string) => {
  const calendar = getGoogleCalendarClient();

  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    eventId,
  });
};



const createmeeting = async (data: {
  userId: string;
  topic: string;
  startTime: string;
  duration: number;
  timezone?: string;
  organizationId?: string;
  attendeeEmail?: string;
}) => {
  try {
    const timezone = data.timezone || "Asia/Dhaka";


    let token;
    try {
      token = await getZoomToken();
      console.log("✅ Zoom token received:", token);
    } catch (err: any) {
      console.log("❌ Zoom token error:", err?.response?.data);
      throw new Error("Zoom token failed: " + JSON.stringify(err?.response?.data));
    }


    let zoomResponse;
    try {
      zoomResponse = await axios.post(
        "https://api.zoom.us/v2/users/me/meetings",
        {
          topic: data.topic,
          type: 2,
          start_time: data.startTime,
          duration: data.duration,
          timezone,
          settings: {
            host_video: true,
            participant_video: true,
            waiting_room: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
    } catch (err: any) {
      console.log("❌ Zoom meeting error:", err?.response?.data);
      throw new Error("Zoom meeting failed: " + JSON.stringify(err?.response?.data));
    }


    let calendarEventId = null;
    try {
      calendarEventId = await createCalendarEvent({
        topic: data.topic,
        startTime: data.startTime,
        duration: data.duration,
        timezone,
        joinUrl: zoomResponse.data.join_url,
        attendeeEmail: data.attendeeEmail,
      });
      console.log("✅ Calendar event created:", calendarEventId);
    } catch (err: any) {
      console.log("❌ Calendar error:", err?.message);
   
    }

    const result = await prisma.meeting.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId || null,
        topic: data.topic,
        startTime: new Date(data.startTime),
        duration: data.duration,
        timezone,
        zoomMeetingId: String(zoomResponse.data.id),
        joinUrl: zoomResponse.data.join_url,
        startUrl: zoomResponse.data.start_url,
        password: zoomResponse.data.password,
        calendarEventId: calendarEventId || null,
        status: "SCHEDULED",
      },
    });

    return result;

  } catch (error: any) {
  
    console.log("❌ Full error:", error?.message);
    throw new AppError(
      httpStatus.BAD_REQUEST,
      error?.message || "Failed to create meeting"
    );
  }
};

const getAllmeetings = async (query: Record<string, any>) => {
  const result = await prisma.meeting.findMany({
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const getSinglemeeting = async (id: string) => {
  const result = await prisma.meeting.findUnique({ where: { id } });
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Meeting not found!");
  }
  return result;
};


const updatemeeting = async (
  id: string,
  data: {
    topic?: string;
    startTime?: string;
    duration?: number;
    timezone?: string;
    status?: MeetingStatus; 
  }
) => {
  const existingMeeting = await prisma.meeting.findUnique({ where: { id } });
  if (!existingMeeting) {
    throw new AppError(httpStatus.NOT_FOUND, "Meeting not found!");
  }


  if (existingMeeting.zoomMeetingId) {
    try {
      const token = await getZoomToken();
      await axios.patch(
        `https://api.zoom.us/v2/meetings/${existingMeeting.zoomMeetingId}`,
        {
          topic: data.topic,
          start_time: data.startTime,
          duration: data.duration,
          timezone: data.timezone,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to update Zoom meeting!");
    }
  }

  if (existingMeeting.calendarEventId) {
    try {
      await updateCalendarEvent(existingMeeting.calendarEventId, data);
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to update Calendar event!");
    }
  }


  const result = await prisma.meeting.update({
    where: { id },
    data: {
      topic: data.topic,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      duration: data.duration,
      timezone: data.timezone,
      status: data.status,
    },
  });

  return result;
};

const deletemeeting = async (id: string) => {
  const existingMeeting = await prisma.meeting.findUnique({ where: { id } });
  if (!existingMeeting) {
    throw new AppError(httpStatus.NOT_FOUND, "Meeting not found!");
  }


  if (existingMeeting.zoomMeetingId) {
    try {
      const token = await getZoomToken();
      await axios.delete(
        `https://api.zoom.us/v2/meetings/${existingMeeting.zoomMeetingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to delete Zoom meeting!");
    }
  }

  if (existingMeeting.calendarEventId) {
    try {
      await deleteCalendarEvent(existingMeeting.calendarEventId);
    } catch (error) {
      throw new AppError(httpStatus.BAD_REQUEST, "Failed to delete Calendar event!");
    }
  }
  await prisma.meeting.delete({ where: { id } });
  return null;
};

export const meetingService = {
  createmeeting,
  getAllmeetings,
  getSinglemeeting,
  updatemeeting,
  deletemeeting,
};