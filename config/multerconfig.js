const multer = require('multer'); 

// diskStorage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) { 
        const fn = `${Date.now()}-${file.originalname}`
      cb(null, fn)
    }
  })

// export upload variable
const upload = multer({ storage: storage });

module.exports = upload