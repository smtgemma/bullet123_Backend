import config from "../config";
import nodemailer from "nodemailer";

export const sendEmail = async (
  to: string,
  resetPassLink?: string,
  confirmLink?: string
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const clickableResetPass = `<a href="${resetPassLink}" style="color: #28C76F; text-decoration: underline;">here</a>`;
  const clickableConfirm = `<a href="${confirmLink}" style="color: #28C76F; text-decoration: underline;">here</a>`;

  const html = `
  <div style="max-width: 600px; margin: 0 auto; background-color: #F6F7F9; color: #000; border-radius: 8px; padding: 24px;">
    <table style="width: 100%;">
      <tr>
        <td>
          <div style="padding: 5px; text-align: center;">
            <img src="https://res.cloudinary.com/shariful10/image/upload/v1751971147/logo_cfqynn.png" alt="logo" style="height: 40px; margin-bottom: 16px;" />
          </div>
        </td>
        <td style="text-align: right; color: #999;">${formattedDate}</td>
      </tr>
    </table>

    
    ${
      confirmLink
        ? `<h3 style="text-align: center; color: #000;">Verify Your Email Within 10 Minutes</h3>
       <div style="padding: 0 1em;">
         <p style="text-align: left; line-height: 28px; color: #000;">
           <strong style="color: #000;">Verification Link:</strong> Click ${clickableConfirm} to verify your email.
         </p>
       </div>`
        : `<h3 style="text-align: center; color: #000;">Reset Your Password Within 10 Minutes</h3>
       <div style="padding: 0 1em;">
         <p style="text-align: left; line-height: 28px; color: #000;">
           <strong style="color: #000;">Reset Link:</strong> Click ${clickableResetPass} to reset your password.
         </p>
       </div>`
    }
  </div>
  `;

  await transporter.sendMail({
    from: `"support@homewrk.net" <${config.sendEmail.email_from}>`,
    to,
    subject:resetPassLink ,
    text: "",
    html:confirmLink
  });
};

export const sendContactEmail = async (to: string, payload: { fullName: string; email: string; subject?: string |undefined; description: string }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const html = `
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f7f9fc; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background-color: #007bff; padding: 20px; color: #fff; text-align: center;">
      <h2 style="margin: 0;">New Contact </h2>
    </div>
    <div style="padding: 20px; color: #333; line-height: 1.5;">
      <p><strong>Full Name:</strong> ${payload.fullName}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Subject:</strong> ${payload?.subject||"Admin Role Invitation Sent"}</p>
      <p><strong>Message:</strong><br/>${payload.description.replace(/\n/g, "<br/>")}</p>
    </div>
    <div style="background-color: #f1f3f6; padding: 15px; text-align: center; color: #555; font-size: 12px;">
      &copy; ${new Date().getFullYear()} Art hub. All rights reserved.
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: ` ${payload.fullName} <${config.sendEmail.email_from}>`,
    to:to||"hasansanim562@gmail.com",
    subject: `New Contact: ${payload?.subject|| "Admin Role Invitation Sent"}`,
    text: `Full Name: ${payload.fullName}\nEmail: ${payload.email}\nSubject: ${payload.subject}\nMessage: ${payload.description}`,
    html,
  });
};


export const sendUserMessageEmail = async (
  to: string,
  payload: {
    senderName: string;
    senderEmail: string;
    subject?: string;
    message: string;
  }
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const html = `
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9fafb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
    
    <div style="background: linear-gradient(90deg, #2563eb, #3b82f6); padding: 22px; color: #fff; text-align: center;">
      <h2 style="margin: 0;">You Have a New Message</h2>
      <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">
        Sent via support@homewrk.net Platform
      </p>
    </div>

    <div style="padding: 24px; color: #374151; line-height: 1.6;">
      <p><strong>From:</strong> ${payload.senderName}</p>
      <p><strong>Email:</strong> ${payload.senderEmail}</p>
      <p><strong>Subject:</strong> ${payload.subject || "New Message Notification"}</p>

      <div style="margin-top: 16px; padding: 16px; background-color: #f3f4f6; border-left: 4px solid #3b82f6; border-radius: 6px;">
        ${payload.message.replace(/\n/g, "<br/>")}
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 14px; text-align: center; color: #6b7280; font-size: 12px;">
      &copy; ${new Date().getFullYear()} support@homewrk.net. All rights reserved.
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"${payload.senderName}" <${config.sendEmail.email_from}>`,
    to,
    subject: payload.subject || "You have a new message",
    text: `From: ${payload.senderName}\nEmail: ${payload.senderEmail}\n\n${payload.message}`,
    html,
  });
};

export const sendBulkEmail = async (
  recipients: string[], 
  subject: string,
  message: string,
  isHtml: boolean = false 
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const htmlTemplate = `
  <div style="max-width: 600px; margin: 0 auto; background-color: #F6F7F9; color: #000; border-radius: 8px; padding: 24px;">
    <table style="width: 100%;">
      <tr>
        <td>
          <div style="padding: 5px; text-align: center;">
            <img src="https://postimg.cc/1gzmD9XV" alt="logo" style="height: 40px; margin-bottom: 16px;" />
          </div>
        </td>
        <td style="text-align: right; color: #999;">${formattedDate}</td>
      </tr>
    </table>
    
    <div style="padding: 20px; background-color: #fff; border-radius: 8px; margin-top: 16px;">
      ${message}
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
      &copy; ${new Date().getFullYear()} doppelgangermatch. All rights reserved.
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"support@homewrk.net" <${config.sendEmail.email_from}>`,
    bcc: recipients, 
    subject: subject,
    text: isHtml ? undefined : message, 
    html: isHtml ? htmlTemplate : undefined, 
  });
};


export const sendSubscriptionEmail = async (
  to: string,
  type: "UPGRADE" | "CANCEL",
  data: {
    fullName: string;
    planName: string;
    planType: string;
    amount?: number;
    currency?: string;
    nextBillingDate?: string;
    invoiceUrl?: string;
    pdfUrl?: string;
    cancelDate?: string;
    features?: string[];
  }
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  let subject = "";
  let html = "";

  if (type === "UPGRADE") {
    subject = `🎉 You're now on the ${data.planName} Plan!`;
    html = `
    <div style="max-width:600px;margin:auto;background:#F6F7F9;border-radius:8px;padding:24px;font-family:Arial">
      <table width="100%">
        <tr>
          <td align="center">
            <img src="https://res.cloudinary.com/shariful10/image/upload/v1751971147/logo_cfqynn.png" style="height:40px;margin-bottom:12px"/>
          </td>
          <td align="right" style="color:#999;font-size:12px">${formattedDate}</td>
        </tr>
      </table>

      <div style="background:#fff;border-radius:8px;padding:24px;margin-top:16px">
        <h2 style="color:#28C76F;text-align:center;margin-top:0">🎉 You're now on the ${data.planName} Plan!</h2>
        <p style="color:#333">Hi <strong>${data.fullName}</strong>,</p>
        <p style="color:#333">Thank you for upgrading! Your subscription is now active and you have access to all the new features.</p>

        ${data.features && data.features.length > 0 ? `
        <div style="background:#f0fdf4;border-left:4px solid #28C76F;padding:16px;border-radius:6px;margin:16px 0">
          <p style="margin:0;font-weight:bold;color:#000">✨ What you've unlocked:</p>
          <ul style="margin:8px 0 0;padding-left:20px;color:#333">
            ${data.features.map(f => `<li style="margin:4px 0">${f}</li>`).join("")}
          </ul>
        </div>` : ""}

        <div style="background:#f8f9fa;border-radius:6px;padding:16px;margin:16px 0">
          <p style="margin:0;font-weight:bold;color:#000">💳 Billing Details:</p>
          <p style="margin:8px 0 0;color:#333">Plan: <strong>${data.planName}</strong></p>
          <p style="margin:4px 0;color:#333">Amount: <strong>${data.currency} ${data.amount}</strong></p>
          <p style="margin:4px 0;color:#333">Next Billing Date: <strong>${data.nextBillingDate}</strong></p>
        </div>

        ${data.invoiceUrl || data.pdfUrl ? `
        <div style="text-align:center;margin-top:20px">
          ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" style="background:#28C76F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:0 8px;display:inline-block">View Invoice</a>` : ""}
          ${data.pdfUrl ? `<a href="${data.pdfUrl}" style="background:#4A90E2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:0 8px;display:inline-block">Download PDF</a>` : ""}
        </div>` : ""}
      </div>

      <p style="text-align:center;color:#999;font-size:12px;margin-top:20px">
        © ${new Date().getFullYear()} Ainoviro. All rights reserved.
      </p>
    </div>`;
  }

  if (type === "CANCEL") {
    subject = `Subscription Cancellation Confirmed`;
    html = `
    <div style="max-width:600px;margin:auto;background:#F6F7F9;border-radius:8px;padding:24px;font-family:Arial">
      <table width="100%">
        <tr>
          <td align="center">
            <img src="https://res.cloudinary.com/shariful10/image/upload/v1751971147/logo_cfqynn.png" style="height:40px;margin-bottom:12px"/>
          </td>
          <td align="right" style="color:#999;font-size:12px">${formattedDate}</td>
        </tr>
      </table>

      <div style="background:#fff;border-radius:8px;padding:24px;margin-top:16px">
        <h2 style="color:#333;text-align:center;margin-top:0">Subscription Cancellation Confirmed</h2>
        <p style="color:#333">Hi <strong>${data.fullName}</strong>,</p>
        <p style="color:#333">We're sorry to see you go. Your <strong>${data.planName}</strong> subscription has been cancelled.</p>

        <div style="background:#fff8f0;border-left:4px solid #FF9F43;padding:16px;border-radius:6px;margin:16px 0">
          <p style="margin:0;color:#333">⏳ You still have access to all <strong>${data.planName}</strong> features until:</p>
          <p style="margin:8px 0 0;font-size:18px;font-weight:bold;color:#FF9F43">${data.cancelDate}</p>
        </div>

        <p style="color:#333">After that date, your account will be downgraded to the free plan.</p>
        <p style="color:#333">If this was a mistake, you can reactivate your subscription anytime from your account settings.</p>

        <div style="text-align:center;margin-top:20px">
          <a href="#" style="background:#28C76F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Reactivate Subscription</a>
        </div>
      </div>

      <p style="text-align:center;color:#999;font-size:12px;margin-top:20px">
        © ${new Date().getFullYear()} Ainoviro. All rights reserved.
      </p>
    </div>`;
  }

  await transporter.sendMail({
    from: `"Ainoviro" <${config.sendEmail.email_from}>`,
    to,
    subject,
    html,
  });
};




export const sendNudgeEmail = async (
  to: string,
  type: "SLOT_WARNING" | "RENEWAL_REMINDER",
  data: {
    fullName: string;
    planName: string;
    usedSlots?: number;
    totalSlots?: number;
    remainingSlots?: number;
    renewalDate?: string;
    amount?: number;
    currency?: string;
    upgradeUrl?: string;
  }
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: config.sendEmail.brevo_email,
      pass: config.sendEmail.brevo_pass,
    },
  });

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  let subject = "";
  let html = "";

  if (type === "SLOT_WARNING") {
    const usedPercent = Math.round(((data.usedSlots || 0) / (data.totalSlots || 1)) * 100);
    subject = `⚠️ You've used ${usedPercent}% of your artwork slots`;
    html = `
    <div style="max-width:600px;margin:auto;background:#F6F7F9;border-radius:8px;padding:24px;font-family:Arial">
      <table width="100%">
        <tr>
          <td align="center">
            <img src="https://res.cloudinary.com/shariful10/image/upload/v1751971147/logo_cfqynn.png" style="height:40px;margin-bottom:12px"/>
          </td>
          <td align="right" style="color:#999;font-size:12px">${formattedDate}</td>
        </tr>
      </table>

      <div style="background:#fff;border-radius:8px;padding:24px;margin-top:16px">
        <h2 style="color:#FF9F43;text-align:center;margin-top:0">⚠️ Running Low on Artwork Slots!</h2>
        <p style="color:#333">Hi <strong>${data.fullName}</strong>,</p>
        <p style="color:#333">You've used <strong>${usedPercent}%</strong> of your artwork slots on the <strong>${data.planName}</strong> plan.</p>

        <!-- Progress Bar -->
        <div style="background:#f0f0f0;border-radius:50px;height:20px;margin:16px 0;overflow:hidden">
          <div style="background:${usedPercent >= 90 ? '#EA5455' : '#FF9F43'};height:100%;width:${usedPercent}%;border-radius:50px;transition:width 0.3s"></div>
        </div>

        <div style="background:#fff8f0;border-left:4px solid #FF9F43;padding:16px;border-radius:6px;margin:16px 0">
          <p style="margin:0;color:#333">📊 <strong>Used:</strong> ${data.usedSlots} / ${data.totalSlots} slots</p>
          <p style="margin:8px 0 0;color:#333">🎨 <strong>Remaining:</strong> ${data.remainingSlots} slots</p>
        </div>

        <p style="color:#333">Upgrade now to get more slots and avoid any interruption to your workflow.</p>

        <div style="text-align:center;margin-top:20px">
          <a href="${data.upgradeUrl || '#'}" style="background:#FF9F43;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold">
            Upgrade My Plan
          </a>
        </div>
      </div>

      <p style="text-align:center;color:#999;font-size:12px;margin-top:20px">
        © ${new Date().getFullYear()} support@homewrk.net. All rights reserved.
      </p>
    </div>`;
  }

  if (type === "RENEWAL_REMINDER") {
    subject = `🔔 Your ${data.planName} plan renews in 7 days`;
    html = `
    <div style="max-width:600px;margin:auto;background:#F6F7F9;border-radius:8px;padding:24px;font-family:Arial">
      <table width="100%">
        <tr>
          <td align="center">
            <img src="https://res.cloudinary.com/shariful10/image/upload/v1751971147/logo_cfqynn.png" style="height:40px;margin-bottom:12px"/>
          </td>
          <td align="right" style="color:#999;font-size:12px">${formattedDate}</td>
        </tr>
      </table>

      <div style="background:#fff;border-radius:8px;padding:24px;margin-top:16px">
        <h2 style="color:#4A90E2;text-align:center;margin-top:0">🔔 Renewal Reminder</h2>
        <p style="color:#333">Hi <strong>${data.fullName}</strong>,</p>
        <p style="color:#333">Just a heads-up! Your <strong>${data.planName}</strong> subscription will automatically renew in <strong>7 days</strong>.</p>

        <div style="background:#f0f7ff;border-left:4px solid #4A90E2;padding:16px;border-radius:6px;margin:16px 0">
          <p style="margin:0;color:#333">📅 <strong>Renewal Date:</strong> ${data.renewalDate}</p>
          <p style="margin:8px 0 0;color:#333">💳 <strong>Amount:</strong> ${data.currency} ${data.amount}</p>
          <p style="margin:8px 0 0;color:#333">📦 <strong>Plan:</strong> ${data.planName}</p>
        </div>

        <p style="color:#333">No action needed if you'd like to continue. If you wish to cancel or make changes, please do so before the renewal date.</p>

        <div style="text-align:center;margin-top:20px;display:flex;gap:12px;justify-content:center">
          <a href="#" style="background:#28C76F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:0 8px">
            Manage Subscription
          </a>
          <a href="#" style="background:#EA5455;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:0 8px">
            Cancel Plan
          </a>
        </div>
      </div>

      <p style="text-align:center;color:#999;font-size:12px;margin-top:20px">
        © ${new Date().getFullYear()} support@homewrk.net. All rights reserved.
      </p>
    </div>`;
  }

  await transporter.sendMail({
    from: `"support@homewrk.net" <${config.sendEmail.email_from}>`,
    to,
    subject,
    html,
  });
};