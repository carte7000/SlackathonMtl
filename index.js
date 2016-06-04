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

var parseUserIdFromInput = function(userId){
    return userId.substr(1, userId.trim().length-2);
}

var absentUser = [];

var isUserAvailable = function(userId){
    return absentUser.filter(function(user){
        return user.id == userId; 
    }).length == 0;
}

var queryUsername = function(userId, callback){      
    var slack = new Slack(token.token_api);
 
    slack.api("users.list", function(err, response) {
        response.members.forEach(function(member){
            if(member.id == userId){
                callback(member.name);
            }
        });
    });
};

controller.hears(["check (.*)"], ["direct_message", "direct_mention"], function(bot, message){
    var rawUsername = message.match[1]; //username
    var username=parseUserIdFromInput(rawUsername);
    username=username.substr(1);
    console.log(absentUser);
     var targetMessage={user: username};
     console.log(targetMessage);
    bot.startPrivateConversation(targetMessage,function(err,conversation){
        conversation.say("are u here ");
    });

    if(isUserAvailable(username)){
        bot.reply(message,rawUsername + ' is available.');
    } else {
        bot.reply(message, rawUsername + ' is not available.');

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