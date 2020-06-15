const fs = require('fs');
var usrFileName = "./users.json";

var users = {};
var fileLocked = false;

function loadUsers() {
    fs.readFile(usrFileName, (err, data) => {
        if (err) throw err;
        users = JSON.parse(data);
    });
}

function saveUsers() {
	if(!fileLocked){
		fileLocked = true;
        var json = JSON.stringify(users);
		fs.writeFile(usrFileName, json, 'utf8', function (err) {
			if (err) throw err;
			fileLocked = false;
		})
	}
}

function registerUser(msg) {
    var uid = msg.chat.id;
    var usr = {enabled: true, data: {from: msg.from, chat: msg.chat}, counter:{value:0,interval:6,activeMessageId:0}};
    users[uid] = usr;
    saveUsers();
}

function getUser(uid) {
    return users[uid];
}

function getUserList() {
    return Object.keys(users);
}

function setMetaData(uid, key, val) {
    users[uid].data[key] = val;
    saveUsers();
}

function getMetaData(uid, key) {
    return users[uid].data[key];
}

function setCounter(uid, val) {
    users[uid].counter.value = val;
    saveUsers();
}
function setCounterInterval(uid, interval){
    users[uid].counter.interval = interval;
    saveUsers();
}
function setActiveMessageId(uid, activeMessageId){
    users[uid].counter.activeMessageId = activeMessageId;
    saveUsers();
}
function getCounter(uid) {
    return users[uid].counter.value;
}
function getCounterInterval(uid){
    return users[uid].counter.interval;
}
function getActiveMessageId(uid){
    return users[uid].counter.activeMessageId;
}

function getChatType(uid){
    return users[uid].data.chat.type;
}

module.exports = {
    loadUsers,
    registerUser,
    getUserList,
    setMetaData,
    getMetaData,
    setCounter,
    getCounter,
    setCounterInterval,
    getCounterInterval,
    getActiveMessageId,
    getChatType,
    setActiveMessageId
};