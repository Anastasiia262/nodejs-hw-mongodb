import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

export default function env(name, defaultValue) {
  const value = process.env[name] || defaultValue;
  if (value) return value;
  throw new Error(`${name} variable not found`);
}
