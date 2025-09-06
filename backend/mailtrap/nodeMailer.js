import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "956c0b001@smtp-brevo.com",
    pass: "Egft6yLac2zDjw75",
  },
});

export default transporter;
