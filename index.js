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

var queryUserFromChannel = function(channelId, callback){
    var slack = new Slack(token.token_api);
 
    slack.api("users.list", {channel: channelId}, function(err, response) {
        callback(response.members);
    });
}

var createIsAvailableResult = function(isAvailabe){
    if(isAvailabe){
        return "is available";
    }
    else {
        return "is not available";
    }
}

controller.hears(["check (.*)"], ["direct_message", "direct_mention"], function(bot, message){
    var username = message.match[1]; //username
    if(username == "all"){
        var text = "";
        queryUserFromChannel(message.channel, function(members){
            members.forEach(function(member){
                if(!member.is_bot){
                    text += member.name + " " + createIsAvailableResult(isUserAvailable("@"+member.id)) + "\n";
                }
            });
            return bot.reply(message, text);
        });
    } else {
        return bot.reply(message, username + createIsAvailableResult(isUserAvailable(parseUserIdFromInput(username))));
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