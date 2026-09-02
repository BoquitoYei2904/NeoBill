import { sendExpirationReminders } from "../lib/licitationLogic/licitationExpirationReminders.js";

sendExpirationReminders()
  .then((result) => {
    console.log("Reminder check complete:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Reminder check failed:", err);
    process.exit(1);
  });