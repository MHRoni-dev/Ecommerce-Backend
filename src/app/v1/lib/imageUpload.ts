import config from '@config/index';
import { Express } from 'express';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';
import streamfier from 'streamifier';
// >> setup cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
});

//< add this middleware in the endpoint that need single file upload
export const uploadSingleFile = (
  uploadFile: Express.Multer.File,
  options: UploadApiOptions,
): Promise<UploadApiResponse | undefined> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        }
        resolve(result);
      },
    );
    streamfier.createReadStream(uploadFile.buffer).pipe(uploadStream);
  });
};
//>

//< add this middleware in the endpoint that need multiple file upload
export const uploadMultipleFiles = (
  uploadFiles: Express.Multer.File[],
  options: UploadApiOptions,
): Promise<(UploadApiResponse | undefined)[]> => {
  return Promise.all(
    uploadFiles.map((file) => uploadSingleFile(file, options)),
  );
};
//>

// >> folder names
const ROOT_FOLDER = 'ecommerce';
export const UPLODAD_FOLDER = {
  USER: ROOT_FOLDER + '/user',
  PRODUCT: ROOT_FOLDER + '/product',
};
