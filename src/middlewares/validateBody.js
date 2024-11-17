import createHttpError from 'http-errors';

export const validateBody = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const details = error.details
      ? error.details.map((err) => ({
          message: err.message,
          path: err.path.join('.'),
        }))
      : [];

    console.error('Validation errors:', details); // Логируем ошибки валидации
    next(createHttpError(400, 'Validation Error', { errors: details }));
  }
};
