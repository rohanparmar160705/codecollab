import { v2 as cloudinary } from "cloudinary";
import { logger } from "../utils/logger";
import streamifier from "streamifier";

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const CloudinaryService = {
  /**
   * Upload an image buffer to Cloudinary
   * @param buffer File buffer
   * @param folder Destination folder in Cloudinary
   * @returns Promise with upload result
   */
  async uploadImage(
    buffer: Buffer,
    folder: string = "avatars"
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `codecollab/${folder}`,
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" }, // Face detection & crop
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary upload failed", error);
            return reject(error);
          }
          if (!result?.secure_url) {
            return reject(new Error("Cloudinary upload returned no URL"));
          }
          resolve(result.secure_url);
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  },

  /**
   * Generate a signed upload URL (optional, if we want client-side uploads later)
   */
  generateSignature(folder: string = "avatars") {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: `codecollab/${folder}`,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  },
};
