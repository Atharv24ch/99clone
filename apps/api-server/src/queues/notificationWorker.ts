import { Worker } from "bullmq";

import { createWorkerRedis } from "../config/redis.js";
import { appUrl, emailLayout, escapeHtml, sendEmail } from "../services/email.js";

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
 * SMS is not wired to a provider yet (Twilio / MSG91 / Fast2SMS are the usual
 * choices for India); messages are logged so lead routing still works end to end.
 */
async function sendSms(phone: string, message: string): Promise<void> {
  console.log(`[sms:stub] To: ${phone}\n  ${message}`);
}

/**
 * BullMQ worker that delivers lead and listing notifications.
 */
const notificationWorker = new Worker<NotificationJobData>(
  "notifications",
  async (job) => {
    const { type, agentPhone, agentEmail, buyerName, buyerPhone } = job.data;

    switch (type) {
      case "new_lead": {
        const name = buyerName ?? "A buyer";
        const phone = buyerPhone ?? "no number given";
        const leadsUrl = `${appUrl()}/dashboard/leads`;

        await Promise.allSettled([
          agentPhone ? sendSms(agentPhone, `New enquiry on Aangan from ${name} (${phone}). ${leadsUrl}`) : Promise.resolve(),
          agentEmail
            ? sendEmail({
                to: agentEmail,
                subject: `New enquiry from ${name}`,
                text: `${name} (${phone}) enquired about your listing on Aangan. See it at ${leadsUrl}`,
                html: emailLayout(
                  "You have a new enquiry",
                  `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(phone)}) is interested in your listing.</p>
                   <p><a href="${leadsUrl}" style="color:#5B2D8E">Open your enquiries</a> to call them back.</p>`
                ),
              })
            : Promise.resolve(),
        ]);
        break;
      }

      case "property_approved": {
        const { userEmail, message } = job.data;
        if (userEmail) {
          const listingsUrl = `${appUrl()}/dashboard/listings`;
          await sendEmail({
            to: userEmail,
            subject: "Your listing is live",
            text: `${message ?? "Your property has been approved and is now live."} ${listingsUrl}`,
            html: emailLayout(
              "Your listing is live",
              `<p>${escapeHtml(message ?? "Your property has been approved and now appears in search.")}</p>
               <p><a href="${listingsUrl}" style="color:#5B2D8E">View your listings</a></p>`
            ),
          });
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
  console.error(`Notification job ${job?.id ?? "unknown"} failed:`, err.message);
});

console.log("Notification worker started");
