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

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + "/components/express_webserver.js")(
  controllerWeb
);

// Load in a plugin that defines the bot's identity
require(__dirname + "/components/plugin_identity.js")(controllerWeb);

// Watson middleware
var watsonMiddleware = require("botkit-middleware-watson")({
  username: "0ee55dd8-1bd8-4229-b06e-4c903bd79550",
  password: "6qrlRVCgtN6B",
  workspace_id: "47ed99a1-b95e-449b-8b91-9a89b73936c8",
  version_date: "2018-11-16",

  minimum_confidence: 0.5 // (Optional) Default is 0.75
});

// Define controllers to use watson middleWare
controllerWeb.middleware.receive.use(watsonMiddleware.receive);

// enable advanced botkit studio metrics
// and capture the metrics API to use with the identity plugin!
// controller.metrics = require("botkit-studio-metrics")(controller);

// Open the web socket server
controllerWeb.openSocketServer(controllerWeb.httpserver);


//controllerWeb.changeEars(watsonMiddleware.hear);
// Start the bot brain in motion!!
controllerWeb.startTicking();

var normalizedPath = require("path").join(__dirname, "skills");
require("fs")
  .readdirSync(normalizedPath)
  .forEach(function(file) {
    require("./skills/" + file)(controllerWeb);
  });

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
*/
const util = require('util');
controllerWeb.hears([".*"], ["message_received"], (bot, message) => {
  console.log(message);
  console.log(message.watsonData.intents);
  watsonMiddleware.interpret(bot, message, function() {
    if (message.watsonError) {
      bot.reply(message, "OOPS 500 - Watson server error. Not our fault :(");
     }

     else {
       console.log("____________REPLY_START_________________");
       console.log("INTENTS:",message.watsonData.intents);
       console.log("TEXT: ", message.watsonData.output.text);
       console.log("NODES VISITED: ", message.watsonData.output.nodes_visited);
       console.log("SYSTEM: ", message.watsonData.context.system);
       console.log("____________VERBOSE_________________");
       console.log("WATSON: ",message.watsonData);
       console.log("____________OBJECT__________________");
       console.log(util.inspect(message.watsonData.output.generic, {showHidden: false, depth: null}));
       console.log("____________REPLY_END___________________");
      //bot.reply(message, message.watsonData.output.text.join("\n"));
      bot.reply(message, message.watsonData.output.generic);
    }
  });
});

/*
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
*/

function usage_tip() {
  console.log("~~~~~~~~~~");
  console.log("Botkit Starter Kit");
  console.log("Execute your bot application like this:");
  console.log("PORT=3000 studio_token=<MY BOTKIT STUDIO TOKEN> node bot.js");
  console.log("Get a Botkit Studio token here: https://studio.botkit.ai/");
  console.log("~~~~~~~~~~");
}
