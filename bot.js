/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var env = require("node-env-file");
env(__dirname + "/.env");

var Botkit = require("botkit");
var debug = require("debug")("botkit:main");

var bot_options = {
  studio_token: process.env.studio_token,
  studio_command_uri: process.env.studio_command_uri,
  studio_stats_uri: process.env.studio_command_uri,
  replyWithTyping: true,
  type: "web"
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
  // create a custom db access method
  var db = require(__dirname + "/components/database.js")({});
  bot_options.storage = db;
} else {
  bot_options.json_file_store = __dirname + "/.data/db/"; // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
var controllerWeb = Botkit.socketbot(bot_options);

/*var controllerCiscoSpark = Botkit.sparkbot({
  // debug: true,
  // limit_to_domain: ['mycompany.com'],
  // limit_to_org: 'my_cisco_org_id',
  public_address: process.env.public_address,
  ciscospark_access_token: process.env.access_token,
  secret: process.env.secret, // this is an RECOMMENDED but optional setting that enables validation of incoming webhooks
  webhook_name: "DD omnichannel botikit app",
  replyWithTyping: true,
  type: "cisco"
});*/

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + "/components/express_webserver.js")(
  controllerWeb//,
  //controllerCiscoSpark
);

// Load in a plugin that defines the bot's identity
require(__dirname + "/components/plugin_identity.js")(controllerWeb);

// Tell Cisco Spark to start sending events to this application
//require(__dirname + "/components/subscribe_events.js")(controllerCiscoSpark);

// Watson middleware
var watsonMiddleware = require("botkit-middleware-watson")({
  username: "0ee55dd8-1bd8-4229-b06e-4c903bd79550",
  password: "6qrlRVCgtN6B",
  workspace_id: "47ed99a1-b95e-449b-8b91-9a89b73936c8",
  version_date: "2018-11-16",

  minimum_confidence: 0.5 // (Optional) Default is 0.75
});

// Define controllers to use watson middleWare
//controllerCiscoSpark.middleware.receive.use(watsonMiddleware.receive);
controllerWeb.middleware.receive.use(watsonMiddleware.receive);

// controllerCiscoSpark.changeEars(watsonMiddleware.hear);

// enable advanced botkit studio metrics
// and capture the metrics API to use with the identity plugin!
// controller.metrics = require("botkit-studio-metrics")(controller);

// Open the web socket server
controllerWeb.openSocketServer(controllerWeb.httpserver);


//controllerWeb.changeEars(watsonMiddleware.hear);
// Start the bot brain in motion!!
controllerWeb.startTicking();
//controllerCiscoSpark.startTicking();

var normalizedPath = require("path").join(__dirname, "skills");
require("fs")
  .readdirSync(normalizedPath)
  .forEach(function(file) {
    require("./skills/" + file)(controllerWeb);
  });

/*require("fs")
  .readdirSync(normalizedPath)
  .forEach(function(file) {
    require("./skills/" + file)(controllerCiscoSpark);
  });*/

console.log(
  "I AM ONLINE! COME TALK TO ME: http://localhost:" + (process.env.PORT || 3000)
);
/*
controllerWeb.hears(['branch'], ["message_received"], watsonMiddleware.hear , (bot, message) => {
  watsonMiddleware.interpret(bot, message, function() {
    if (message.watsonError) {
      bot.reply(message, "Oh no. 500");
    } else {
      bot.reply(message, message.watsonData.output.text.join("\n"), () => {
        bot.reply(message,{
          text: "Vyberte:",
          quick_replies: [
            {
              title: "Brno",
              payload: "brno"
            },
            {
              title: "Praha",
              payload: "praha"
            },
            {
              title: "Ostrava",
              payload: "ostrava"
            }
          ],

          typingDelay: 1000
        });
      });
    }
  });
});

controllerWeb.hears([".*"], ["message_received"], (bot, message) => {
  console.log(message);
  console.log(message.watsonData.intents);
  watsonMiddleware.interpret(bot, message, function() {
    if (message.watsonError) {
      bot.reply(message, "Oh no. 500");
     }

     else {
       console.log("INTENTS:",message.watsonData.intents);
      bot.reply(message, message.watsonData.output.text.join("\n"));
    }
  });
});

controllerCiscoSpark.hears(
  [".*"],
  ["direct_message", "direct_mention", "mention"],
  (bot, message) => {
    watsonMiddleware.interpret(bot, message, function() {
      if (message.watsonError) {
        bot.reply(message, "Oh no. 500");
      } else {
        bot.reply(message, message.watsonData.output.text.join("\n"));
      }
    });
  }
);
*/
controllerWeb.on("hello", (bot, message) => {
  bot.say({
    text: "Hello world, message from bot js.",
    type: "message",
    typingDelay: 2000
  });
});

controllerWeb.on("welcome_back", function(bot, message) {
  bot.say({
    text: "Welcome back, message from bot js.",
    type: "message",
    typingDelay: 2000
  });
});

function usage_tip() {
  console.log("~~~~~~~~~~");
  console.log("Botkit Starter Kit");
  console.log("Execute your bot application like this:");
  console.log("PORT=3000 studio_token=<MY BOTKIT STUDIO TOKEN> node bot.js");
  console.log("Get a Botkit Studio token here: https://studio.botkit.ai/");
  console.log("~~~~~~~~~~");
}
