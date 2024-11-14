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

export const createContactController = async (req, res) => {
  const { body } = req;
  const userId = req.user._id;
  const contact = await createContact(body, userId);

  res.status(201).json({
    status: 201,
    message: `Successfully created a contact!`,
    data: contact,
  });
};

export const patchContactController = async (req, res, next) => {
  const { contactId } = req.params;
  const userId = req.user._id;
  const photo = req.file;

  let photoUrl;

  // Если передан файл фотографии
  if (photo) {
    if (env('ENABLE_CLOUDINARY') === 'true') {
      // Если Cloudinary включен, сохраняем фото туда
      photoUrl = await saveFileToCloudinary(photo);
    } else {
      // В противном случае сохраняем фото на сервер
      photoUrl = await saveFileToUploadDir(photo);
    }
  }

  // Данные для обновления контакта
  const updatedData = {
    ...req.body,
    photoUrl,  // Добавляем photoUrl в данные для обновления
  };

  // Обновление контакта в базе данных
  const contact = await updateContact(contactId, updatedData, userId);

  if (!contact) {
    return next(createHttpError(404, 'Contact not found'));
  }

  // Ответ на запрос
  res.status(200).json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: contact,
  });
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
