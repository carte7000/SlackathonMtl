var token = require('./token.json');
var http = require('https');
var Slack = require('slack-node');
var Botkit = require('botkit');
var controller = Botkit.slackbot();
var bot = controller.spawn({
  token: token.token
})
var _timer;


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
}

var isUserInitialize = function(userId){
    return !(absentUserMap[userId]);
}

var getReason = function(userId) {
    return absentUserMap[userId];
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


var pokeTarget=function(targetname,user, channel){
    targetname=targetname.substr(1);
    var targetMessage={user: targetname};
    bot.startPrivateConversation(targetMessage,function(response,convoAsk) {
    queryUsername(user, function(username) {

    _timer = setTimeout(function(){
        convoAsk.stop();
        bot.startPrivateConversation(targetMessage,function(response,TEST) {
            TEST.say(createSadAnswer("Why ignoring me?"));
            convoAsk.stop();
            bot.say({channel: channel, text: username + " did not answer me."});
        });
    }, 3*60000);

    convoAsk.ask("Hey ! "+username+" wants to know if you're available.", function(response,conversation) {
                cancelTimeout(_timer);
                convoAsk.stop();
                queryUsername(targetname, function(targetUsername){
                    bot.startPrivateConversation(targetMessage,function(res,TEST) {
                        TEST.say("Thank you!");
                        bot.say({channel: channel, text: targetUsername + " said: " + response.text});
                    });
                });
            });
        });
    });
};

var displayImage = function() {
    
    console.log('display TRISTE image here....');
}

function cancelTimeout(timer) {
    clearTimeout(timer);
} 

controller.hears(["find (.*)"], ["direct_message", "direct_mention"], function(bot, message){
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
        var available = isUserAvailable(parseUserIdFromInput(username));
        if(!available){
            if(isUserInitialize(parseUserIdFromInput(username))){
                return bot.reply(message, username + " " + createIsAvailableResult(parseUserIdFromInput(username), isUserAvailable(parseUserIdFromInput(username))));       
            } else {
                pokeTarget(parseUserIdFromInput(username),message.user, message.channel);
            }
        } else {
             pokeTarget(parseUserIdFromInput(username),message.user, message.channel);
        }
    }
});

controller.hears(["absent(.*)"], ["direct_message"], function(bot, message){
    var status = message.match[1].trim();
    var userId = message.user; //UserId
    queryUsername(userId, function(username){
        absentUserMap["@"+userId] = status;
        bot.reply(message, 'Roger that!'); 
    });
});

controller.hears(["back"], ["direct_message"], function(bot, message){
    var userId = message.user; //UserId
    queryUsername(userId, function(username){
        delete absentUserMap["@"+userId];
        console.log(userId);
        bot.reply(message, "Yahoo! I'm happy to see you again."); 
    });
});

var createSadAnswer = function(text){
    return {
      text: text,
      username: "valdo",
      icon_emoji: ":sad:",
    }
}

var createAngryAnswer = function(text){
    return {
      text: text,
      username: "valdo",
      icon_emoji: ":angry_waldo:",
    }
}