import createHttpError from 'http-errors';

export const validateBody = (schema) => async (req, res, next) => {
  try {
    // Виконання валідації
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    // Перевірка наявності деталей помилок
    const details = error.details
      ? error.details.map((err) => ({
          message: err.message,
          path: err.path.join('.'), // З’єднуємо шлях до поля
        }))
      : [];

    // Логування помилок
    console.error('Validation errors:', details);

    // Передача помилки в middleware
    next(createHttpError(400, 'Validation Error', { errors: details }));
  }
};
