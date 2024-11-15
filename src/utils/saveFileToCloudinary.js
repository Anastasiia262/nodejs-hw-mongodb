import fs from 'fs/promises';
import cloudinary from 'cloudinary';
import env from './env.js';
import { CLOUDINARY } from '../constants/constants.js';

// Конфигурация Cloudinary
cloudinary.v2.config({
  secure: true,
  cloud_name: env(CLOUDINARY.CLOUD_NAME),
  api_key: env(CLOUDINARY.API_KEY),
  api_secret: env(CLOUDINARY.API_SECRET),
});

/**
 * Загружает файл в Cloudinary и удаляет временный файл
 * @param {Object} file - Объект файла, созданный multer
 * @returns {Promise<string>} - Ссылка на загруженное изображение
 * @throws {Error} - Ошибка загрузки или удаления файла
 */
export const saveFileToCloudinary = async (file) => {
  try {
    // Проверяем наличие файла
    if (!file || !file.path) {
      throw new Error('File is missing or invalid');
    }

    // Загружаем файл в Cloudinary
    const response = await cloudinary.v2.uploader.upload(file.path);
    console.log('Uploaded to Cloudinary:', response);

    // Удаляем временный файл
    await fs.unlink(file.path);
    console.log(`Temporary file deleted: ${file.path}`);

    return response.secure_url;
  } catch (error) {
    console.error('Error in saveFileToCloudinary:', error.message);

    // Попробуем удалить файл, если возникла ошибка
    if (file && file.path) {
      try {
        await fs.unlink(file.path);
        console.warn(`Temporary file removed after error: ${file.path}`);
      } catch (unlinkError) {
        console.error(`Failed to remove temporary file: ${unlinkError.message}`);
      }
    }

    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};
