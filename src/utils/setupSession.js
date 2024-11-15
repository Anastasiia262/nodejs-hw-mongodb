// src/utils/setupSession.js
export const setupSession = (res, session) => {
    // Пример установки cookies для сессии и токена
    res.cookie('sessionId', session.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.cookie('accessToken', session.accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  };
