import dotenv from 'dotenv';
dotenv.config();

export default function env(name, defaultValue) {
  const value = process.env[name] || defaultValue;
  console.log(`Загружено значение переменной ${name}:`, value); 
  if (value !== undefined) {
    return value;
  } else {
    throw new Error(`${name} variable not found`);
  }
}
