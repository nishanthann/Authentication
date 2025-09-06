import { MailtrapClient } from "mailtrap";
import dotenv from "dotenv";

dotenv.config();

// const TOKEN = "874e2526913d46a570a46b1faceda0e4";
const TOKEN = "4d205178a1ea8470123abddc637ba6a6";

export const Client = new MailtrapClient({
  token: TOKEN,
});

export const sender = {
  email: "hello@demomailtrap.co",
  name: "Mailtrap Test",
};
