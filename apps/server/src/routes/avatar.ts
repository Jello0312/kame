import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';
import * as AvatarService from '../services/AvatarService.js';
import type { ApiResponse } from '@kame/shared-types';

const router: Router = Router();

// ─── Multer Config ──────────────────────────────────

const ALLOWED_MIMES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG and PNG images are allowed', 400));
    }
  },
});

const uploadFields = upload.fields([
  { name: 'facePhoto', maxCount: 1 },
  { name: 'bodyPhoto', maxCount: 1 },
]);

// ─── Multer Error Handler ───────────────────────────

function handleMulterError(err: Error, _req: Request, _res: Response, next: NextFunction): void {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError('File too large. Maximum size is 10MB', 400));
      return;
    }
    next(new AppError(err.message, 400));
    return;
  }
  next(err);
}

// ─── Routes ─────────────────────────────────────────

router.post(
  '/',
  authenticate,
  uploadFields,
  handleMulterError,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      const avatarFiles = {
        facePhoto: files?.facePhoto?.[0]?.buffer,
        bodyPhoto: files?.bodyPhoto?.[0]?.buffer,
      };

      if (!avatarFiles.facePhoto && !avatarFiles.bodyPhoto) {
        next(new AppError('At least one photo (facePhoto or bodyPhoto) is required', 400));
        return;
      }

      const avatar = await AvatarService.uploadAvatar(req.userId!, avatarFiles);
      const response: ApiResponse<typeof avatar> = {
        success: true,
        data: avatar,
        message: 'Avatar uploaded',
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const avatar = await AvatarService.getAvatar(req.userId!);
      const response: ApiResponse<typeof avatar> = {
        success: true,
        data: avatar,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  },
);

export { router as avatarRouter };
