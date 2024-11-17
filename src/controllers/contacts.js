import createHttpError from 'http-errors';
import {
  createContact,
  deleteContactById,
  getAllContacts,
  getContactById,
  updateContact,
} from '../services/contacts.js';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import env from '../utils/env.js';

export const getAllContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);
  const userId = req.user._id;

  const contacts = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
    userId,
  });

  res.status(200).json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res) => {
  const id = req.params.contactId;
  const userId = req.user._id;
  const contact = await getContactById(id, userId);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(200).json({
    status: 200,
    message: `Successfully found contact with ${id}`,
    data: contact,
  });
};

export const createContactController = async (req, res, next) => {
  const { body } = req;
  const userId = req.user._id;
  const photo = req.file;  // Получаем фото из запроса

  let photoPath = null;

  if (photo) {
    try {
      if (env('ENABLE_CLOUDINARY') === 'true') {
        // Загружаем фото в Cloudinary
        photoPath = await saveFileToCloudinary(photo);
      } else {
        // В случае отключения Cloudinary, сохраняем на сервере
        photoPath = await saveFileToUploadDir(photo);
      }
    } catch (error) {
      return next(createHttpError(500, `Error processing photo: ${error.message}`));
    }
  }

  const newContactData = {
    ...body,
    photo: photoPath,  // Сохраняем ссылку на фото
  };

  try {
    const contact = await createContact(newContactData, userId);  // Создаем контакт с фото

    res.status(201).json({
      status: 201,
      message: 'Successfully created a contact!',
      data: contact,
    });
  } catch (error) {
    next(error);  // Обработка ошибок
  }
};


export const patchContactController = async (req, res, next) => {
  console.log('Request Params:', req.params);  // Логируем параметры URL
  console.log('Request Body:', req.body);  // Логируем тело запроса

  const { contactId } = req.params;
  const userId = req.user._id;
  const photo = req.file;  // Получаем фото из запроса

  if (!contactId) {
    return next(createHttpError(400, 'Contact ID is required'));
  }

  let photoPath = null;

  if (photo) {
    try {
      if (env('ENABLE_CLOUDINARY') === 'true') {
        // Загружаем фото в Cloudinary
        photoPath = await saveFileToCloudinary(photo);
      } else {
        // В случае отключения Cloudinary, сохраняем на сервере
        photoPath = await saveFileToUploadDir(photo);
      }
    } catch (error) {
      console.error("Error processing photo:", error);  // Логирование ошибки загрузки фото
      return next(createHttpError(500, `Error processing photo: ${error.message}`));
    }
  }

  const updatedData = {
    ...req.body,
    photo: photoPath,  // Добавляем ссылку на фото в объект обновленных данных
  };

  try {
    const contact = await updateContact(contactId, updatedData, userId);

    if (!contact) {
      return next(createHttpError(404, 'Contact not found'));
    }

    // Обновляем photo в объекте контакта перед отправкой в ответ
    contact.photo = photoPath || contact.photo;  // Обновляем поле photo (если фото новое)

    res.status(200).json({
      status: 200,
      message: 'Successfully patched the contact!',
      data: contact,  // Теперь ссылка на фото будет в данных контакта
    });
  } catch (error) {
    console.error("Error updating contact:", error);  // Логирование ошибки при обновлении контакта
    return next(createHttpError(500, `Error updating contact: ${error.message}`));
  }
};

export const deleteContactController = async (req, res) => {
  const id = req.params.contactId;
  const userId = req.user._id;
  const contact = await deleteContactById(id, userId);

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).send();
};


