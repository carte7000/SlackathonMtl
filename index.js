var token = require('./token.json');
var http = require('https');
var Slack = require('slack-node');
var Botkit = require('botkit');
var controller = Botkit.slackbot();
var bot = controller.spawn({
  token: token.token
})
bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

var createMessage = function(userId, message){
    return {
        "type": "message",
        "user": userId,
        "text": message
    }
}

var absentUser = [];

var isUserAvailable = function(userId){
    console.log(userId);
    return absentUser.filter(function(user){
        return user.id == userId; 
    }).length == 0;
}

var apiToken = "xoxp-48216674839-48208903350-48220842262-59f8a16744";

var queryUsername = function(userId, callback){      
    var slack = new Slack(apiToken);
 
    slack.api("users.list", function(err, response) {
        response.members.forEach(function(member){
            if(member.id == userId){
                callback(member.name);
            }
        });
    });
};

controller.hears(["check (.*)"], ["direct_message", "direct_mention"], function(bot, message){
    var username = message.match[1]; //username
    console.log(absentUser);
    if(isUserAvailable(username)){
        bot.reply(message, username + ' is available.');
    } else {
        bot.reply(message, username + ' is not available.');
    }
});

controller.hears(["absent (.*)"], ["direct_message"], function(bot, message){
    var status = message.match[1];
    var userId = message.user; //UserId
    queryUsername(userId, function(username){
        absentUser.push({id:"@"+userId, status: status});
        bot.reply(message, 'Roger that!'); 
    });
});