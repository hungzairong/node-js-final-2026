// utils/appError.js — 統一錯誤格式
const appError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
  };
  module.exports = appError;