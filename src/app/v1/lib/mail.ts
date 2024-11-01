import config from '@config/index';
import nodemailer from 'nodemailer';

type MailOptions =
  | { to: string; subject: string; text: string }
  | { to: string; subject: string; html: string };

export async function sendMail(data: MailOptions) {
  const transporter = nodemailer.createTransport({
    host: config.MAIL.HOST,
    port: config.MAIL.PORT,
    secure: config.MAIL.SECURE,
    auth: {
      user: config.MAIL.USER,
      pass: config.MAIL.PASS,
    },
  });

  const mailOptions = {
    from: `${config.MAIL.APP} <${config.MAIL.FROM}>`,
    ...data,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      'Message sent: to ',
      data.to,
      'with id ',
      info.messageId,
      'subject ',
      data.subject,
    );
  } catch (error) {
    console.log(`Email not sent, Error: ${error}`);
    throw error;
  }
}
