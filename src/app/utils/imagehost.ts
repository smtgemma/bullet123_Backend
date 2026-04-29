import express, { NextFunction, Request, Response } from "express";
import { imageUpload } from "../config/multer-config";

const route = express.Router();

route.post(
  "/images",
  imageUpload.array("images", 5),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.MulterS3.File[];
      const imageUrls = files.map((file) => file.location);

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        images: imageUrls,
        files: imageUrls,
      });
    } catch (err) {
      next(err);
    }
  },
);


export const imagesHostRoute = route;
