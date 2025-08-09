exports.generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.storeOtp = (store, email, otp) => {
  store[email] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min expiry
};

exports.validateOtp = (store, email, otp) => {
  const record = store[email];
  if (record && record.otp === otp && Date.now() < record.expires) {
    delete store[email];
    return true;
  }
  return false;
};