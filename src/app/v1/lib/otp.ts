import config from '@config/index';

export const generateOTP = (): string => {
  const otp = Math.floor(
    10 ** (config.SECURITY.OTP_LENGTH - 1) +
      Math.random() * 9 ** (config.SECURITY.OTP_LENGTH - 1),
  );

  return `${otp}`;
};
