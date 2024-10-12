import Contact from '../db/models/contact.js';

export async function getAllContacts() {
  try {
    return await Contact.find({}); 
  } catch (error) {
    console.error(error);
  }
}

export async function getContactById(id) {
  try {
    return await Contact.findById(id); 
  } catch (error) {
    console.error(error);
    return null;
  }
}
