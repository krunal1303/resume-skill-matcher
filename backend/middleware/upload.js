const multer = require('multer');
const path = require('path');

// multer's default disk storage drops the original extension; the extraction
// module dispatches on file extension (.pdf vs .docx), so we must preserve it.
const storage = multer.diskStorage({
    destination: 'backend/uploads/',
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

module.exports = multer({ storage });
