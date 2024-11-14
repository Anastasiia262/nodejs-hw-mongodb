import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import env from '../utils/env.js';  // Импорт без фигурных скобок
import { SMTP } from '../constants/constants.js';

const transporter = nodemailer.createTransport({
  host: env(SMTP.SMTP_HOST),
  port: Number(env(SMTP.SMTP_PORT)),
  auth: {
    user: env(SMTP.SMTP_USER),
    pass: env(SMTP.SMTP_PASSWORD),
  },
});

export const sendEmail = async (options) => {
  return await transporter.sendMail(options);
};
