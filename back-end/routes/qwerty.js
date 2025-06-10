const express = require("express");
const router = express.Router();
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// const https = require("https");
// const db = require('/usr/src/backendpdmc/jharkhand_pdmc_backend/routes/db/getData');
/* const db = require('/home/ubuntu/pdmc/backendapi/routes/db/getData'); */
// const multer = require("multer");

const db = require("./db/getData");

const jwt = require("jsonwebtoken");
const fs = require("fs");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
require("dotenv").config();

router.use(bodyParser.urlencoded({ extended: false }));

router.use(bodyParser.json());
router.use(bodyParser.text());

router.use(express.json());

const fileUpload = require("express-fileupload");
const { districts } = require("../data/districtData");
const AppError = require("../AppError");
const { catchError } = require("../middleware/errorHandler");
const {
  createLatLongValidator,
  createEstimateValidator,
  createComponentValidator,
  createVendorOptionalComponentValidator,
  getUnitCostValidator,
} = require("../validations/supplierValidators");
router.use(fileUpload());

function authorizeRoute(req, res, next) {
  try {
    if (req.headers["authorization"] !== undefined) {
      const token = req.headers.authorization.split(" ")[1];
      const privateKey = process.env.AUTH_TOKEN_KEY;
      console.log(token);

      //Authorization: 'Bearer TOKEN'
      if (!token) {
        res.status(401).json({
          res: "failure",
          message: "Error! Token was not provided.",
        });
      } else {
        //Decoding the token
        jwt.verify(token, privateKey, (err, decoded) => {
          if (err) {
            throw new AppError(
              401,
              JSON.stringify({
                res: "failure",
                message: err.message,
              }),
              401
            );
          } else {
            let userID = decoded.userId;
            if (!userID) {
              throw new AppError(
                200,
                JSON.stringify({
                  res: "failure",
                  message: "Error! User is not authorized to access PDMC.",
                }),
                200
              );
            } else {
              return next();
            }
          }
        });
      }
    } else {
      res
        .status(401)
        .json({ res: "failure", message: "Invalid token for autorization!" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
}

router.get("/verifytoken", (req, res, next) => {
  try {
    if (req.headers["authorization"] !== undefined) {
      const token = req.headers.authorization.split(" ")[1];
      const privateKey = process.env.AUTH_TOKEN_KEY;
      console.log(token);

      //Authorization: 'Bearer TOKEN'
      if (!token) {
        throw new AppError(
          200,
          JSON.stringify({
            success: false,
            message: "Error! Token was not provided.",
          }),
          200
        );
      } else {
        //Decoding the token
        jwt.verify(token, privateKey, (err, decoded) => {
          if (err) {
            console.log(err);
            return next(err, null, res);
          } else {
            let userID = decoded.userId;
            if (!userID) {
              throw new AppError(
                200,
                JSON.stringify({
                  res: "failure",
                  message: "Error! User is not authorized to access PDMC.",
                }),
                200
              );
            } else {
              return next();
            }
          }
        });
      }
    } else {
      throw new AppError(
        200,
        JSON.stringify({
          errordata: [
            { res: "failure", message: "Invalid token for autorization!" },
          ],
        }),
        200
      );
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/* upload images, documents */
router.post("/uploadfile", (req, res, next) => {
  try {
    const { files } = req;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    // Assuming you've validated and checked that 'file' exists in 'files'
    const file = files.file;

    // Specify the destination directory where you want to store the file
    const destination = "uploadedimages/";
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }
    const filename = Date.now() + file.name;

    // Move the file to the destination
    file.mv(`${destination}${filename}`, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error uploading file.");
      }
      // File is successfully uploaded
      // res.send(`${destination}${filename}`);
      res.status(200).send({
        res: "success",
        message: "file uploaded",
        path: `${destination}${filename}`,
      });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/* upload and compress video files */
router.post("/uploadvideofile", (req, res, next) => {
  try {
    const { files } = req;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    // Assuming you've validated and checked that 'file' exists in 'files'
    const file = files.file;

    // Specify the destination directory where you want to store the file
    const destination = "uploadedimages/";
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }

    const filename = Date.now() + file.name;
    const uploadedFilePath = `${destination}${filename}`;

    // Move the file to the destination folder
    file.mv(uploadedFilePath, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error uploading file.");
      }

      // Compress the video using ffmpeg, even if we don't check the file type
      const compressedFilePath = `${destination}compressed_${filename}`;

      ffmpeg(uploadedFilePath)
        .output(compressedFilePath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .size("600x600") // Set desired resolution or other compression parameters
        .on("end", async () => {
          // After compression is done, delete the original uncompressed file
          await fs.unlink(uploadedFilePath, (err) => {
            if (err) {
              console.log("Error deleting original file:", err);
            }
          });

          await fs.rename(compressedFilePath, uploadedFilePath, (err) => {
            if (err) res.status(500).json({ message: "Internal Server Error" });
          });

          // Send response with the path of the compressed video
          res.status(200).send({
            res: "success",
            message: "File uploaded and compressed successfully",
            path: uploadedFilePath,
          });
        })
        .on("error", (err) => {
          console.log("Error during video compression:", err);
          res.status(500).send("Error during video compression.");
        })
        .run();
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/

/* upload only images like .png .jpeg, .jpg */
router.post("/uploadimage", (req, res) => {
  try {
    const { files } = req;
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    // Assuming you've validated and checked that 'file' exists in 'files'
    const file = files.file;

    // Array of allowed files
    const array_of_allowed_files = ["png", "jpeg", "jpg"];
    const array_of_allowed_file_types = [
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];

    // Get the extension of the uploaded file
    const file_extension = file.originalname.slice(
      ((file.originalname.lastIndexOf(".") - 1) >>> 0) + 2
    );

    // Check if the uploaded file is allowed
    if (
      !array_of_allowed_files.includes(file_extension) ||
      !array_of_allowed_file_types.includes(file.memetype)
    ) {
      //throw Error('Invalid file');
      return res.status(500).send("Invalid file.");
    }

    // Specify the destination directory where you want to store the file
    const destination = "uploadedimages/";
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);
    }
    const filename = Date.now() + file.name;

    // Move the file to the destination
    file.mv(`${destination}${filename}`, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error uploading file.");
      }
      // File is successfully uploaded
      // res.send(`${destination}${filename}`);
      res.status(200).send({
        res: "success",
        message: "file uploaded",
        path: `${destination}${filename}`,
      });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});



router.get("/uploadedimages/:filename", (req, res) => {
  try {
    const { filename } = req.params;

    let directory = __dirname;
    directory = directory.replace("routes", "");
    const filePath = path.join(directory, "uploadedimages", filename);

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(404).end();
      } else {
        res.status(200).end();
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/* API for jwt generation where method = POST */
router.post("/validate", function (req, res, next) {
  try {
    if (!req.body.userid) {
      throw new AppError(
        200,
        JSON.stringify({
          res: "failure",
          message: "Error! User is not authorized to access PDMC.",
        }),
        200
      );
    } else {
      const privateKey = process.env.AUTH_TOKEN_KEY;

      const token = jwt.sign({ userId: req.body.userid }, privateKey, {
        expiresIn: "30d",
      });

      res.json({ token });
      res.end();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/* API for division where method = GET */
router.get("/division", authorizeRoute, function (req, res, next) {
  db.division(req.query, function (err, rows) {
    try {
      if (err) {
        res.json(err);
        next(err);
        // res.end();
      } else {
        res.json(rows[0]);
        res.end();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
});

/* API for division where method = PPOST */
router.post("/division", authorizeRoute, function (req, res, next) {
  db.division(req.body, function (err, rows) {
    try {
      if (err) {
        res.json(err);
        res.end();
      } else {
        res.json(rows[0]);
        res.end();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
});





router.post("/admindashboard", function (req, res, next) {
  console.log(req.body);
  db.admin(req.body, (err, rows) => {
    try {
      if (err) {
        res.status(500).send("Internal Server Error");
        next(err);
      } else {
        res.status(201).json(rows[0]);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
});

/* API for user where method = GET */
router.get("/user", function (req, res, next) {
  db.user(req.query, function (err, rows) {
    try {
      if (err) {
        res.json(err);
        res.end();
      } else {
        const result = {};

        result["result"] = rows[0];
        //result["countData"] = rows[1];
        //result["countDataMore"] = rows[2];

        res.json(result);
        res.end();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
});




/* API for user where method = post */
router.post("/user", function (req, res, next) {
  db.user(req.body, function (err, rows) {
    try {
      if (err) {
        res.json(err);
        res.end();
      } else {
        const result = {};

        result["result"] = rows[0];
        //result["countData"] = rows[1];
        //result["countDataMore"] = rows[2];

        res.json(result);
        res.end();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
});



/* API for verify where method = post */
router.post("/verify", function (req, res, next) {
  db.verify(req.body, function (err, rows) {
    try {
      if (err) {
        res.json(err);
        res.end();
      } else {
        const result = {};

        result["result"] = rows[0];
        //result["countData"] = rows[1];
        //result["countDataMore"] = rows[2];

        res.json(result);
        res.end();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
});

/* API for user where method = GET */
router.get("/calllog", function (req, res, next) {
  db.calllog(req.query, function (err, rows) {
    try {
      if (err) {
        res.json(err);
        res.end();
      } else {
        const result = {};

        result["result"] = rows[0];
        //result["countData"] = rows[1];
        //result["countDataMore"] = rows[2];

        res.json(result);
        res.end();
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
});







router.use(catchError);

module.exports = router;
