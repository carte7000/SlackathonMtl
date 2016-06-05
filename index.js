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

var parseUserIdFromInput = function(userId){
    return userId.substr(1, userId.trim().length-2);
}

var absentUser = [];
var absentUserMap = {};

var isUserAvailable = function(userId){
    return !(absentUserMap[userId]) && absentUserMap[userId] != "";
    // return absentUser.filter(function(user){
    //     return user.id == userId; 
    // }).length == 0;
}

var getReason = function(userId) {
    return absentUserMap[userId];
    // return absentUser.filter(function(user){
    //     return user.id == userId; 
    // })[0].status;
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

var createIsAvailableResult = function(userId, isAvailabe){
    if(isAvailabe){
        return "is available";
    }
    else {
        var reason = getReason(userId) + "";
        if(reason == ""){
            return "is not available";
        } else {
            return "is not available : " + reason;
        }
    }
}


var pokeTarget=function(targetname,user){
     targetname=targetname.substr(1);
     var targetMessage={user: targetname};
    bot.startPrivateConversation(targetMessage,function(response,conversation){
    queryUsername(user, function(username){
   conversation.ask("Hey ! "+username+" wants to know if you're available.",function(response,conversation){
                    console.log(response);

                            });
                     });
              });
        };


controller.hears(["check (.*)"], ["direct_message", "direct_mention"], function(bot, message){
    var username = message.match[1]; //username
    if(username == "all"){
        var text = "";
        queryUserFromChannel(message.channel, function(members){
            members.forEach(function(member){
                if(!member.is_bot){
                    text += member.name + " " + createIsAvailableResult("@"+member.id, isUserAvailable("@"+member.id)) + "\n";
                }
            });
            return bot.reply(message, text);
        });
    } else {
        var available= isUserAvailable(parseUserIdFromInput(username));
        if(!available){
        pokeTarget(parseUserIdFromInput(username),message.user);
        }
        return bot.reply(message, username + " " + createIsAvailableResult(parseUserIdFromInput(username), isUserAvailable(parseUserIdFromInput(username))));
    }
});

controller.hears(["absent(.*)"], ["direct_message"], function(bot, message){
    var status = message.match[1].trim();
    var userId = message.user; //UserId
    queryUsername(userId, function(username){
        absentUserMap["@"+userId] = status;
        // absentUser.push({id:"@"+userId, status: status});
        bot.reply(message, 'Roger that!'); 
    });
});

controller.hears(["back"], ["direct_message"], function(bot, message){
    var userId = message.user; //UserId
    queryUsername(userId, function(username){
        delete absentUserMap["@"+userId];
        console.log(userId);
        bot.reply(message, 'Yahooo!'); 
    });
});