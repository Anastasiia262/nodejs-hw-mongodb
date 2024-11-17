import { ONE_DAY } from '../constants/constants.js';
import {
  loginUser,
  logoutUser,
  refreshUsersSession,
  registerUser,
  requestResetToken,
  resetPassword
} from '../services/auth.js';

const setupSessionCookies = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expires: new Date(Date.now() + ONE_DAY),
  });
  res.cookie('sessionId', session._id, {
    httpOnly: true,
    expires: new Date(Date.now() + ONE_DAY),
  });
};

export const registerUserController = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      status: 201,
      message: 'Successfully registered a user!',
      data: user,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const loginUserController = async (req, res, next) => {
  try {
    const session = await loginUser(req.body);
    setupSessionCookies(res, session);

    res.status(200).json({
      status: 200,
      message: 'Successfully logged in a user!',
      data: { accessToken: session.accessToken },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const refreshUserSessionController = async (req, res, next) => {
  try {
    const session = await refreshUsersSession({
      sessionId: req.cookies.sessionId,
      refreshToken: req.cookies.refreshToken,
    });
    setupSessionCookies(res, session);

    res.json({
      status: 200,
      message: 'Successfully refreshed the session!',
      data: {
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const logoutUserController = async (req, res, next) => {
  try {
    if (req.cookies.sessionId) {
      await logoutUser({
        sessionId: req.cookies.sessionId,
        refreshToken: req.cookies.refreshToken,
      });
    }

    res.clearCookie('sessionId');
    res.clearCookie('refreshToken');

    res.status(204).send();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const requestResetEmailController = async (req, res, next) => {
  try {
    await requestResetToken(req.body.email);
    res.json({
      message: 'Reset password email was successfully sent!',
      status: 200,
      data: {},
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const resetPasswordController = async (req, res) => {
  await resetPassword(req.body);
  res.json({
    message: 'Password was successfully reset!',
    status: 200,
    data: {},
  });
};

