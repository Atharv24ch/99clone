import { Worker } from "bullmq";
import { createWorkerRedis } from "../config/redis.js";

const redis = createWorkerRedis();

interface NotificationJobData {
  type: "new_lead" | "lead_update" | "property_approved" | "property_rejected";
  leadId?: string;
  agentId?: string;
  agentPhone?: string | null;
  agentEmail?: string | null;
  buyerName?: string;
  buyerPhone?: string;
  propertyId?: string;
  userId?: string;
  userEmail?: string;
  message?: string;
}

/**
 * Send SMS via a provider (Twilio/Fast2SMS/MSG91).
 * Stub implementation — replace with actual SDK call.
 */
async function sendSms(phone: string, message: string): Promise<void> {
  if (process.env["NODE_ENV"] === "development") {
    console.log(`📱 [SMS STUB] To: ${phone}\n   Message: ${message}`);
    return;
  }
  // TODO: integrate Twilio / MSG91 / Fast2SMS
  // await twilioClient.messages.create({ to: phone, from: TWILIO_FROM, body: message });
}

/**
 * Send email via a provider (SendGrid/SES/Resend).
 * Stub implementation — replace with actual SDK call.
 */
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (process.env["NODE_ENV"] === "development") {
    console.log(`📧 [EMAIL STUB] To: ${to}\n   Subject: ${subject}\n   Body: ${body}`);
    return;
  }
  // TODO: integrate SendGrid / AWS SES / Resend
}

/**
 * BullMQ worker for sending notifications (SMS + Email) to agents and buyers.
 */
const notificationWorker = new Worker<NotificationJobData>(
  "notifications",
  async (job) => {
    const { type, agentPhone, agentEmail, buyerName, buyerPhone } = job.data;

    switch (type) {
      case "new_lead": {
        const smsMessage = `You have a new lead from ${buyerName ?? "a buyer"} (${buyerPhone ?? "N/A"}). Log in to 99acres to respond.`;
        const emailSubject = `New Lead: ${buyerName ?? "Buyer"} is interested in your property`;
        const emailBody = `
          <p>Dear Agent,</p>
          <p>You have received a new enquiry from <strong>${buyerName}</strong> (${buyerPhone}).</p>
          <p>Log in to your dashboard to view details and contact the buyer.</p>
        `;

        await Promise.allSettled([
          agentPhone ? sendSms(agentPhone, smsMessage) : Promise.resolve(),
          agentEmail ? sendEmail(agentEmail, emailSubject, emailBody) : Promise.resolve(),
        ]);
        break;
      }

      case "property_approved": {
        const { userEmail, message } = job.data;
        if (userEmail) {
          await sendEmail(
            userEmail,
            "Your property listing is live! 🎉",
            message ?? "Your property has been approved and is now live."
          );
        }
        break;
      }

      default:
        console.warn(`Unknown notification type: ${type}`);
    }

    return { sent: true, type };
  },
  {
    connection: redis,
    concurrency: 20,
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  }
);

notificationWorker.on("failed", (job, err) => {
  console.error(`❌ Notification job ${job?.id ?? "unknown"} failed:`, err.message);
});

console.log("📬 Notification worker started");
