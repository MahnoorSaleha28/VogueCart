// Product image uploads.
// With Cloudinary keys set (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET),
// images are stored on Cloudinary, which is needed on hosts like Render whose disk is wiped on every restart.
// Without them, images are saved to public/images as before, which is fine for local development.
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Vercel's disk is read-only, so uploads there only work through Cloudinary
const readOnlyDisk = Boolean(process.env.VERCEL);

const storage = useCloudinary || readOnlyDisk
  ? multer.memoryStorage() // Kept in memory just long enough to send to Cloudinary
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "public", "images")); // Path to save images
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with original extension
      },
    });

// Only accept image files, up to 10 MB
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

// Middleware for one image field; a rejected file shows an error message instead of a crash page
function uploadSingle(field) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (err) {
        req.session.errorMessage = err.code === "LIMIT_FILE_SIZE"
          ? "That image is too large. Please use one under 10 MB."
          : "The image could not be uploaded. Please try again.";
        return res.redirect(req.get("Referrer") || "/admin/products");
      }
      next();
    });
  };
}

// Returns the URL to store on the product for an uploaded file
function saveImage(file) {
  if (!useCloudinary && readOnlyDisk) {
    return Promise.reject(new Error("Image uploads on Vercel need the CLOUDINARY_* environment variables."));
  }
  if (!useCloudinary) {
    return Promise.resolve(`/images/${file.filename}`);
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "the-style-studio/products",
        // Shrink very large photos and let Cloudinary pick the best quality and format
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
  });
}

module.exports = { uploadSingle, saveImage, useCloudinary };
