const fs = require('fs')
const userJsonFile = "./users.json";

let users = {};
let fileLocked = false;

function loadUsers() {
    fs.readFile(userJsonFile, (err, data) => {
        if (err) throw err;
        users = JSON.parse(data);
    });
}

function saveUsers() {
    if (!fileLocked) {
        fileLocked = true;
        var json = JSON.stringify(users);
        fs.writeFile(userJsonFile, json, 'utf8', function (err) {
            if (err) throw err;
            fileLocked = false;
        })
    }
}

function registerUser(msg) {
    const uid = msg.chat.id;
    const usr = {
        enabled: true,
        data: {from: msg.from, chat: msg.chat},
        counter: {value: 0, interval: 6, activeMessageId: 0}
    };
    users[uid] = usr;
    saveUsers();
}

function assert(uid) {
    if (users[uid]) {
        if(users[uid].counter){
            if('value' in users[uid].counter && 'interval' in users[uid].counter && 'activeMessageId' in users[uid].counter){
                return true
            } else {
                users[uid].counter.value = 0;
                users[uid].counter.interval = 6;
                users[uid].counter.activeMessageId = 0;
            }
        } else {
            users[uid].counter = {};
            users[uid].counter.value = 0;
            users[uid].counter.interval = 6;
            users[uid].counter.activeMessageId = 0;
            saveUsers();
        }
    } else {
        users[uid] = {
            enabled: true,
            data: {from: undefined, chat: undefined, error: "user was not initialized properly"},
            counter: {"0": {"value": -1, interval: 100, activeMessageId: 0}}
        };
        saveUsers();
    }
}

function getUser(uid) {
    assert(uid)
    return users[uid];
}

function getUserList() {
    return Object.keys(users);
}

function setCounter(uid, val) {
    assert(uid)
    users[uid].counter.value = val;
    saveUsers();
}

function setCounterInterval(uid, interval) {
    assert(uid)
    users[uid].counter.interval = interval;
    saveUsers();
}

function setActiveMessageId(uid, activeMessageId) {
    assert(uid)
    users[uid].counter.activeMessageId = activeMessageId;
    saveUsers();
}

function getCounter(uid) {
    assert(uid)
    return users[uid].counter.value;
}

function getCounterInterval(uid) {
    assert(uid)
    return users[uid].counter.interval;
}

function getActiveMessageId(uid) {
    assert(uid)
    return users[uid].counter.activeMessageId;
}

function getChatType(uid) {
    assert(uid)
    return users[uid].data.chat.type;
}

module.exports = {
    loadUsers,
    getUser,
    registerUser,
    getUserList,
    setCounter,
    getCounter,
    setCounterInterval,
    getCounterInterval,
    getActiveMessageId,
    getChatType,
    setActiveMessageId
};
