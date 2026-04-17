import prisma from "../../utils/prisma";

interface UpdateSettingsPayload {
  emailNotifications?: boolean;
  messageNotifications?: boolean;
  projectUpdates?: boolean;
  profileVisibility?: boolean;
  showContactInfo?: boolean;
}

// ── Get My Settings (upsert — creates with defaults if not exists) ──────────
const getMySettingsFromDB = async (userId: string) => {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return settings;
};

// ── Update My Settings ─────────────────────────────────────────────────────
const updateMySettingsIntoDB = async (
  userId: string,
  payload: UpdateSettingsPayload
) => {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: payload,
    create: { userId, ...payload },
  });
  return settings;
};

// ── Delete Account ─────────────────────────────────────────────────────────
const deleteAccountFromDB = async (userId: string) => {
  // Soft delete — sets isDeleted to true
  await prisma.user.update({
    where: { id: userId },
    data: { isDeleted: true },
  });
  return null;
};

export const SettingsService = {
  getMySettingsFromDB,
  updateMySettingsIntoDB,
  deleteAccountFromDB,
};
