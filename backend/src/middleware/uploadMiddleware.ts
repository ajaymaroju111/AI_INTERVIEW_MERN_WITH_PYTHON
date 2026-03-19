import type { Request } from "express";
import multer, { type FileFilterCallback, type StorageEngine } from "multer";
import path from "node:path";

const storage: StorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);
    // const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    const sessionId = req.params.id || "unknown-session";

    cb(null, `${sessionId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp3",
    "audio/x-wav",
  ];

  const allowedExtensions = [".mp3", ".wav", ".ogg"];

  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtValid = allowedExtensions.some(ext =>
    file.originalname.toLowerCase().endsWith(ext)
  );

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error("Only valid audio files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

 export const uploadSingleAudio = upload.single('audio');

