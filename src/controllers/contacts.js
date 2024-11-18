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

export const getAllContactsController = async (req, res, next) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);
  const userId = req.user._id;

  try {
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
  } catch (error) {
    console.error('Error fetching contacts:', error);
    next(createHttpError(500, 'Internal Server Error'));
  }
};

export const getContactByIdController = async (req, res, next) => {
  const id = req.params.contactId;
  const userId = req.user._id;

  try {
    const contact = await getContactById(id, userId);

    if (!contact) {
      return next(createHttpError(404, 'Contact not found'));
    }

    res.status(200).json({
      status: 200,
      message: `Successfully found contact with ${id}`,
      data: contact,
    });
  } catch (error) {
    console.error('Error fetching contact by ID:', error);
    next(createHttpError(500, 'Internal Server Error'));
  }
};

export const createContactController = async (req, res) => {
  const { _id: userId } = req.user;
  const photo = req.file;
  let photoUrl = null;

  console.log('Uploaded Photo:', photo); // Логируем информацию о фото

  try {
    // Проверяем, есть ли файл
    if (photo) {
      // Если файл есть, загружаем его в Cloudinary или на сервер
      if (env('ENABLE_CLOUDINARY') === 'true') {
        photoUrl = await saveFileToCloudinary(photo);
      } else {
        photoUrl = await saveFileToUploadDir(photo);
      }

      console.log('Processed Photo URL:', photoUrl); // Логируем URL после загрузки
    }

    // Создаем контакт с переданными данными
    const contact = await createContact({
      ...req.body,
      photo: photoUrl || null,
      userId,
    });

    return res.status(201).json({
      status: 201,
      message: 'Successfully created a contact!',
      data: {
        contact: {
          ...contact.toObject(),
          photo: photoUrl || null, // Добавляем URL фотографии
        },
      },
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    return res.status(500).json({
      status: 500,
      message: `Error creating contact: ${error.message}`,
    });
  }
};


export const patchContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const userId = req.user._id;
  const photo = req.file; // Получаем файл фото из запроса

  console.log('Request Params:', req.params);
  console.log('Request Body:', req.body);
  console.log('Uploaded Photo:', photo);

  if (!contactId) {
    return next(createHttpError(400, 'Contact ID is required'));
  }

  let photoUrl = null;

  // Если загружено фото, обрабатываем его
  if (photo) {
    try {
      if (env('ENABLE_CLOUDINARY') === 'true') {
        // Загружаем фото в Cloudinary
        photoUrl = await saveFileToCloudinary(photo);
      } else {
        // В случае если Cloudinary не включен, сохраняем фото на сервер
        photoUrl = await saveFileToUploadDir(photo);
      }
      console.log('Photo URL:', photoUrl); // Логируем URL фотографии
    } catch (error) {
      console.error('Error processing photo:', error);
      return next(createHttpError(500, `Error processing photo: ${error.message}`));
    }
  }

  // Формируем объект данных для обновления
  const updatedData = {
    ...req.body,
    photo: photoUrl, // Обязательно добавляем photoUrl в объект обновленных данных
  };

  try {
    // Обновляем контакт
    const contact = await updateContact(contactId, updatedData, userId);

    if (!contact) {
      return next(createHttpError(404, 'Contact not found'));
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully patched the contact!',
      data: {
        contact,
      },
    });
  } catch (error) {
    return next(createHttpError(500, `Error updating contact: ${error.message}`));
  }
};

export const deleteContactController = async (req, res, next) => {
  const id = req.params.contactId;
  const userId = req.user._id;

  try {
    const contact = await deleteContactById(id, userId);

    if (!contact) {
      return next(createHttpError(404, 'Contact not found'));
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contact:', error);
    next(createHttpError(500, 'Internal Server Error'));
  }
};
