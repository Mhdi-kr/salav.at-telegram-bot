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
    var usr = {enabled: true, data: {from: msg.from, chat: msg.chat}, counter:{ value:0, interval:6, activeMessageId:0 }};
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

function assertCounter(uid) {
    if(users[uid]) {
        if(users[uid].counter) {
            if(users[uid].counter) {
                if("value" in users[uid].counter) {
                    if("interval" in users[uid].counter){
                        if("activeMessageId" in users[uid].counter){
                            return true;
                        } else {
                            users[uid].counter.activeMessageId = -1;
                        }
                    } else {
                        users[uid].counter.interval = 6;
                    }
                }
                else {
                    users[uid].counter.value = 0;
                }
            }
            else {
                users[uid].counter = {};
                users[uid].counter.value = 0;
                users[uid].counter.interval = 6;
                users[uid].counter.activeMessageId = -1;
                saveUsers();
            }
        }
        else {
            users[uid].counter = {};
            if(users[uid].count) {//old counter detected, migrate count
                users[uid].counter = {value: users[uid].count};
                delete users[uid].count;
            }
            else {
                users[uid].counter = {};
                users[uid].counter.value = 0;
            }
            saveUsers();
        }
    }
    else {
        //console.log("[ERROR] User ID", uid, "does not exist in database");
        var usr = {enabled: true, data: {from: undefined, chat: undefined, error: "user was not initialized properly"}, counter: {"0": {"value": 1}}};
        users[uid] = usr;
        saveUsers();
    }
}

function setCounter(uid, val) {
    assertCounter(uid);
    users[uid].counter.value = val;
    saveUsers();
}
function incrementCounter(uid, val){
    assertCounter(uid);
    var current = users[uid].counter.value;
    current += val;
    users[uid].counter.value = current;
    saveUsers();
}
function setActiveMessageId(ctx){
    assertCounter(uid);
    users[uid].counter.activeMessageId // FIXME
}
function setCounterInterval(uid, val){
    assertCounter(uid);
    users[uid].counter.interval = val;
    saveUsers();
}
function getCounter(uid) {
    assertCounter(uid);
    return users[uid].counter.value;
}
function getCounterInterval(uid){
    assertCounter(uid);
    return users[uid].counter.interval;
}
function getActiveMessageId(uid){
    return users[uid].activeMessageId

}
function getChatType(uid) {
    return users[uid].chat.type
}
function getAllCounters(uid) {
    assertCounter(uid, '0');
    return users[uid].counter;
}

module.exports = {
    loadUsers,
    registerUser,
    getUserList,
    setMetaData,
    getMetaData,
    setCounter,
    getCounter,
    getAllCounters,
    getActiveMessageId,
    getCounterInterval,
    incrementCounter,
    setActiveMessageId,
    setCounterInterval,
    getChatType
};
