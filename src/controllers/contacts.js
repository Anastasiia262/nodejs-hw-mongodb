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

  try {
    if (photo) {
      if (env('ENABLE_CLOUDINARY') === 'true') {
        photoUrl = await saveFileToCloudinary(photo);
      } else {
        photoUrl = await saveFileToUploadDir(photo);
      }
    }

    const contact = await createContact(
      {
        ...req.body,
        photo: photoUrl || null,
      },
      userId
    );

    const {
      _id,
      name,
      phoneNumber,
      email,
      isFavourite,
      contactType,
      createdAt,
      updatedAt,
      photo: contactPhoto,
    } = contact.toObject();

    return res.status(201).json({
      status: 201,
      message: 'Successfully created a contact!',
      data: {
        _id,
        name,
        phoneNumber,
        email,
        isFavourite,
        contactType,
        userId: contact.userId,
        createdAt,
        updatedAt,
        photo: contactPhoto,
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
  const photo = req.file;

  console.log('Request Params:', req.params);
  console.log('Request Body:', req.body);
  console.log('Uploaded Photo:', photo);

  if (!contactId) {
    return next(createHttpError(400, 'Contact ID is required'));
  }

  let photoUrl = null;

  // Обрабатываем фото, если оно было загружено
  if (photo) {
    try {
      if (env('ENABLE_CLOUDINARY') === 'true') {
        photoUrl = await saveFileToCloudinary(photo);
      } else {
        photoUrl = await saveFileToUploadDir(photo);
      }
      console.log('Photo URL:', photoUrl);
    } catch (error) {
      console.error('Error processing photo:', error);
      return next(createHttpError(500, `Error processing photo: ${error.message}`));
    }
  }

  // Обновляем данные контакта
  const updatedData = {
    ...req.body,
    photo: photoUrl,
  };

  try {
    const contact = await updateContact(contactId, updatedData, userId);

    if (!contact) {
      return next(createHttpError(404, 'Contact not found'));
    }

    // Формируем ответ с изменённой структурой
    res.status(200).json({
      status: 200,
      message: 'Successfully patched the contact!',
      data: {
        _id: contact._id,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email,
        isFavourite: contact.isFavourite,
        contactType: contact.contactType,
        userId: contact.userId,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        photo: contact.photo,
      },
    });
  } catch (error) {
    console.error('Error updating contact:', error);
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
