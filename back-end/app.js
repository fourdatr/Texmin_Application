var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
// const xXssProtection = require("x-xss-protection");
const helmet = require("helmet");
var https = require("https"); // https
var fs = require("fs");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var dataRouter = require("./routes/qwerty");
var cors = require("cors");
var app = express();

app.disable("x-powered-by");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(helmet());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
      },
    },
    xFrameOptions: { action: "deny" },
    referrerPolicy: {
      policy: "no-referrer",
    },
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Permissions-Policy", "microphone=(), geolocation=()");
  next();
});

 app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/mining", dataRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

if (process.platform === "win32" && process.env.NODE_ENV === "development") {
  app.listen(3001, () => {
    console.log("App is running on localhost 3001");
  });
} else if (
  process.platform === "linux" &&
  process.env.NODE_ENV === "development"
) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT),
    ca: fs.readFileSync(process.env.SSL_CA),
  };

  https.createServer(options, app).listen(3001, () => {
    console.log("App app is running on localhost 3001");
  });
} else if (
  process.platform === "linux" &&
  process.env.NODE_ENV === "production"
) {
  app.listen(3001, () => {
    console.log("App is running on localhost 3001");
  });
} else {
  app.listen(3001, () => {
    console.log("App is running on localhost 3001");
  });
}

module.exports = app;
