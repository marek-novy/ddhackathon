var express = require("express");
var bodyParser = require("body-parser");
var querystring = require("querystring");
var debug = require("debug")("botkit:webserver");
var http = require("http");
var fs = require("fs");
var hbs = require("express-hbs");
const passport = require("passport");
const OIDCStrategy = require("passport-azure-ad").OIDCStrategy;
const uuid = require("uuid");
const cookieParser = require("cookie-parser");
const config = require("../utils/config");
const graphHelper = require("../utils/graphHelper");
const session = require("express-session");

module.exports = function(controllerWeb, controllerSpark) {
  var webserver = express();

  // SETUP authentification
  const callback = (iss, sub, profile, accessToken, refreshToken, done) => {
    done(null, {
      profile,
      accessToken,
      refreshToken
    });
  };

  passport.use(new OIDCStrategy(config.creds, callback));

  const users = {};
  passport.serializeUser((user, done) => {
    const id = uuid.v4();
    users[id] = user;
    done(null, id);
  });
  passport.deserializeUser((id, done) => {
    const user = users[id];
    done(null, user);
  });

  webserver.use(bodyParser.json());
  webserver.use(bodyParser.urlencoded({ extended: false }));
  webserver.use(cookieParser());

  // set up handlebars ready for tabs
  webserver.engine(
    "hbs",
    hbs.express4({ partialsDir: __dirname + "/../views/partials" })
  );
  webserver.set("view engine", "hbs");
  webserver.set("views", __dirname + "/../views/");

  webserver.use(
    session({
      secret: "sad2345ě+čšžščžěů.-,-ůúúpsad",
      name: "graphNodeCookie",
      resave: false,
      saveUninitialized: false
      //cookie: {secure: true} // For development only
    })
  );
  webserver.use(passport.initialize());
  webserver.use(passport.session());

  // Developer Debug

  // import express middlewares that are present in /components/express_middleware
  var normalizedPathToMiddleware = require("path").join(
    __dirname,
    "express_middleware"
  );
  if (fs.existsSync(normalizedPathToMiddleware)) {
    fs.readdirSync(normalizedPathToMiddleware).forEach(function(file) {
      require("./express_middleware/" + file)(webserver, controllerWeb);
    });

    fs.readdirSync(normalizedPathToMiddleware).forEach(function(file) {
      require("./express_middleware/" + file)(webserver, controllerSpark);
    });
  }

  webserver.use(express.static("public"));

  var server = http.createServer(webserver);

  server.listen(process.env.PORT || 3000, null, function() {
    debug(
      "Express webserver configured and listening at http://localhost:" +
        process.env.PORT || 3000
    );
  });

  // // TODO: Does this call to identify really belong here?
  // if (controller.config.studio_token) {
  //     controller.studio.identify().then(function(identity) {
  //         debug('Botkit Studio Identity:', identity.name);
  //         controller.studio_identity = identity;
  //         webserver.locals.bot = identity;
  //     }).catch(function(err) {
  //         console.log('Error validating Botkit Studio API key!');
  //         throw new Error(err);
  //     });
  // }
  // Authentication request.
  webserver.get(
    "/login",
    passport.authenticate("azuread-openidconnect", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/");
    }
  );
  webserver.get(
    "/token",
    passport.authenticate("azuread-openidconnect", { failureRedirect: "/" }),
    (req, res) => {
      graphHelper.getUserData(req.user.accessToken, (err, user) => {
        if (!err) {
          req.user.profile.displayName = user.body.displayName;
          req.user.profile.emails = [
            { address: user.body.mail || user.body.userPrincipalName }
          ];

          global.accessToken = req.user.accessToken;

          console.log("WTF lol", req.user.profile.displayName);
          res.redirect("/");
        } else {
          renderError(err, res);
        }
      });
    }
  );
  controllerWeb.hears(
    "token",
    ["direct_message", "direct_mention", "mention", "message_received"],
    function(bot, message) {
      bot.reply(message, "aa" + global.accessToken);
    }
  );
  controllerWeb.hears(
    "login",
    ["direct_message", "direct_mention", "mention", "message_received"],
    function(bot, message) {
      passport.authenticate("azuread-openidconnect", { failureRedirect: "/" }),
        (req, res) => {
          console.log("TEST", req.user);

          graphHelper.getTodayMeeting(req.user.accessToken, (err, req) => {
            console.error(err);
            console.log(req);
            if (!err) {
              bot.reply(message, req.value[0].subject);
            }
          });
        };
    }
  );
  // import all the pre-defined routes that are present in /components/routes
  var normalizedPathToRoutes = require("path").join(__dirname, "routes/web");
  if (fs.existsSync(normalizedPathToRoutes)) {
    fs.readdirSync(normalizedPathToRoutes).forEach(function(file) {
      require("./routes/web/" + file)(webserver, controllerWeb);
    });
  }
  // import all the pre-defined routes that are present in /components/routes
  var normalizedPathToRoutes = require("path").join(__dirname, "routes/spark");
  if (fs.existsSync(normalizedPathToRoutes)) {
    fs.readdirSync(normalizedPathToRoutes).forEach(function(file) {
      require("./routes/spark/" + file)(webserver, controllerSpark);
    });
  }

  controllerWeb.webserver = webserver;
  controllerWeb.httpserver = server;

  //controllerSpark.webserver = webserver;

  return webserver;
};
