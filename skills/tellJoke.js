module.exports = function(controller) {
  controller.hears(
    "vtip",
    ["direct_message", "direct_mention", "mention", "message_received"],
    function(bot, message) {
      bot.reply(
        message,
        {
          text: "Hmmm... tak schválně.",
          typing: true
        },
        function() {
          bot.reply(
            message,
            {
              text:
                "Sedí dva zkroušení programátoři v serverovně, přijde k nim třetí a ptá se, proč jsou tak skleslí? ",
              typingDelay: 5000
            },
            () => {
              bot.reply(message, {
                text: "Včera jsme se drobet opili a měnili jsme hesla. 😂😂😂",
                typingDelay: 4000
              });
            }
          );
        }
      );
    }
  );
};
