import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

const getPrivacyPolicy = catchAsync(async (req, res) => {
  const privacyPolicy = `
    Welcome to Homework.net's Privacy Policy. 
    Effective Date: January 19, 2026.
    
    1. Information We Collect: We may collect personal information including name, email address, phone number...
    2. Use of Information: Information is used to operate and improve the platform...
    3. Data Sharing: We do not sell personal data...
    4. Data Security: We implement reasonable safeguards...
    5. Data Retention: Data is retained only as long as necessary...
    6. User Rights: You may request access, correction, or deletion...
    7. Children's Privacy: The platform is not intended for users under 18.
    8. Updates: This policy may be updated periodically.
    
    Contact: support@homework.net
  `;

  sendResponse(res, {
    statusCode: status.OK,
    message: "Privacy Policy retrieved successfully",
    data: { content: privacyPolicy },
  });
});

const getTermsOfService = catchAsync(async (req, res) => {
  const termsOfService = `
    Welcome to Homework.net! These Terms of Service ("Terms") govern your access to and use of the HOMEWRK platform.
    Effective Date: January 19, 2026.
    
    1. Platform Use: You agree to use the platform lawfully and provide accurate information.
    2. Accounts: You are responsible for maintaining account security.
    3. Intellectual Property: All platform content is owned by Homework.net and protected by law.
    4. User Content: You retain ownership of uploaded content and grant Homework.net a license...
    5. Prohibited Conduct: You may not misuse the platform, upload harmful content...
    6. Availability: Services are provided as available and may be modified or interrupted.
    7. Disclaimer: Services are provided "as is" without warranties.
    8. Limitation of Liability: Homework.net is not liable for indirect or consequential damages.
    9. Indemnification: You agree to indemnify Homework.net for claims arising from misuse.
    10. Governing Law: These Terms are governed by the laws of the United States and the State of Maryland.
    
    Contact: support@homework.net
  `;

  sendResponse(res, {
    statusCode: status.OK,
    message: "Terms of Service retrieved successfully",
    data: { content: termsOfService },
  });
});

export const LegalController = {
  getPrivacyPolicy,
  getTermsOfService,
};
