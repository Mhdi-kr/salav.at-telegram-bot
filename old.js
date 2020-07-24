// import libraries
const dataService = require('./dataservice')
const config = require('./config')
const Telegraf = require('telegraf')
const bot = new Telegraf(config.botToken)
const {Markup} = Telegraf
const fetch = require('node-fetch');
// global variables
var totalFetchedCount = 0;
// turn English numbers to persian ones
function toPersianDigits(str){
  var num = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return str.replace(/[0-9]/g, function(w){return num[+w]})
}
function localCalculation(id){
  let localTemp = dataService.getCounter(id)
  if(localTemp){
    return toPersianDigits(localTemp.toString());
  } else {
    return toPersianDigits('0');
  }
}
function globalCalculation(){
  return toPersianDigits(totalFetchedCount.toString())
}

dataService.loadUsers();
function userString(ctx) {
  return JSON.stringify(ctx.from.id == ctx.chat.id ? ctx.from : {
      from: ctx.from,
      chat: ctx.chat
  });
}

function logMsg(ctx) {
  var from = userString(ctx);
  console.log('<', ctx.message.text, from)
}

function hourToMillis(int){
  return int * 1000
}
function logOutMsg(ctx, text) {
  console.log('>', {
      id: ctx.chat.id
  }, text);
}
function deletePreviousMessage(ctx){
  try{
    ctx.deleteMessage(dataService.getActiveMessageId(ctx.chat.id));
  } catch (e) {
    console.log('== no previous message found to delete ==')
  }
}
const botStart = async (ctx) => {
  var userList = dataService.getUserList();
  if(userList.includes(ctx.from.id.toString())){
    // prevent registration if user already exists
    deletePreviousMessage(ctx)
    console.log("already exists");
    var automated = setInterval(function () {
      console.log(hourToMillis(dataService.getCounterInterval(ctx.chat.id)))
      botStart(ctx); 
      ctx.reply(
        msgConstructor(1),
        salavatKeyboardConstructor(1, ctx.chat)).then((m) => {
          dataService.setActiveMessageId(m.chat.id, m.message_id)
        })
      }, hourToMillis(dataService.getCounterInterval(ctx.chat.id)))
  } else {
    // register new user after /start
    dataService.registerUser(ctx);
    dataService.setCounter(ctx.chat.id, 0);
    console.log("new account");
  }

  const result = await 
  fetch('https://api.salav.at/data/salavat/test.json?pwa')
   .then(res => res.json())
   .then(body => {
    totalFetchedCount =  body.salavatCount.count
    return totalFetchedCount;
  });
  ctx.reply(msgConstructor(0), salavatKeyboardConstructor(0, ctx.chat)).then((m) => {
    dataService.setActiveMessageId(m.chat.id, m.message_id)
  })
}

const botConfig = async (ctx) => {
  const result = await 
  fetch('https://api.salav.at/data/salavat/test.json?pwa')
   .then(res => res.json())
   .then(body => {
    totalFetchedCount =  body.salavatCount.count
    return totalFetchedCount;
  });
  ctx.reply(msgConstructor(0), salavatKeyboardConstructor(0, ctx.chat))
}
function showChatCounter(chat){
  let local = localCalculation(chat.id)
  let type = dataService.getChatType(chat.id)
  switch(type){
    case 'private':
      return   `شما تا الان ${local} صلوات فرستاده‌اید`
    case 'group':
      return   `در این گروه تا الان ${local} صلوات فرستاده شده`
    case 'group':
      return   `در این کانال تا الان ${local} صلوات فرستاده شده`
  }
}
function salavatKeyboardConstructor(int, chat){

  const inlineSalavatKyeboard = [
    Markup.inlineKeyboard([
      Markup.callbackButton('هر ۶ ساعت ⌚', '6'),
      Markup.callbackButton('هر ۱۲ ساعت ⌚', '12'),
      Markup.callbackButton('هر ۲۴ ساعت ⌚', '24'),
      Markup.callbackButton('هر ۴۸ ساعت ⌚', '48'),
    ],{columns: 1}).extra(),
    Markup.inlineKeyboard([
      Markup.callbackButton('یه ‌دونه فرستادم', 'one'),
      Markup.callbackButton('ده ‌تا فرستادم', 'ten'),
      Markup.callbackButton(showChatCounter(chat), 'show'),
      Markup.urlButton(`تعداد کل صلوات ها  ${globalCalculation()}`, 'https://salav.at')
    ],{columns: 1}).extra()
  ]
  return inlineSalavatKyeboard[int];
}
bot.command('setting@Salav_at_bot',(ctx) => {botConfig(ctx);})
bot.command('setting',(ctx) => {botConfig(ctx);})

bot.command(['start@Salav_at_bot','start'],(ctx) => {botStart(ctx)})

const helpMessage = `🔻 با اضافه کردن این روبات به گروه‌ها و کانال‌های خودتون، توی فواصل زمانی دلخواه، پیام نذر صلوات به صورت اتوماتیک ارسال میشه.
برای شروع 
/start@Salav_at_bot
رو بزنید`
bot.help((ctx) => {ctx.reply(helpMessage)})
bot.command('help@Salav_at_bot',(ctx) => {ctx.reply(helpMessage)})

// construct template string 
function msgConstructor(int){
  const template = [
    `فاصله‌ی زمانی ارسال پیام نذر صلوات، توسط ربات را انتخاب نمایید:`,
    `همین الان برای سلامتی و فرج امام‌زمان علیه‌السلام صلوات بفرست` + '\n' + ` توی سایت salav.at ثبت میشه`
  ]
  return template[int]
}
//connects to the Salav.at API and updates the total number

function postData(ctx,int){
  const requestBody = {
    data: { count: int, _id: "salavatCount" },
    docId: "salavat/test",
    token: config.salavatToken
  };
  fetch('https://api.salav.at/v1/update-data', {
    method: 'post',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(res => res.json())
    .then(json => {
      console.log(json);

      var val = dataService.getCounter(ctx.chat.id);
      val = parseInt(val);
      val += int;
      dataService.setCounter(ctx.chat.id, val);

      totalFetchedCount =  json.data.count
      ctx.editMessageText(msgConstructor(1),  salavatKeyboardConstructor(1, ctx.chat))
      int == 1 ?   ctx.answerCbQuery('یک صلوات شما با موفقیت ثبت شد ✅') :   ctx.answerCbQuery('ده صلوات شما با موفقیت ثبت شد ✅');
    });
}
function countOne(ctx) {
  console.log("+1")
  ones++;
  postData(ctx,1)
}
function countTen(ctx) {
  console.log("+10")
  tens++;
  postData(ctx,10)
}
bot.action('one', (ctx) => {
  countOne(ctx);
})
bot.action('ten', (ctx) => {
  countTen(ctx);
})
function nextStage(ctx){
  // clearInterval(automated) //resets the timer on start
  ctx.editMessageText(msgConstructor(1),  salavatKeyboardConstructor(1, ctx.chat))
  var automated = setInterval(function () {
    return ctx.reply(
      msgConstructor(1),
      salavatKeyboardConstructor(1, ctx.chat))
    }, hourToMillis(dataService.getCounterInterval()));
}
bot.action('6',(ctx) => { 
  dataService.setCounterInterval(ctx.chat.id, 6);
  ctx.answerCbQuery('پیام صلوات هر ۶ ساعت ارسال می‌گردد ✅');
  nextStage(ctx);
})
bot.action('12',(ctx) => { 
  dataService.setCounterInterval(ctx.chat.id, 12);
  ctx.answerCbQuery('پیام صلوات هر ۱۲ ساعت ارسال می‌گردد ✅');
  nextStage(ctx);
})
bot.action('24',(ctx) => { 
  dataService.setCounterInterval(ctx.chat.id, 24);
  ctx.answerCbQuery('پیام صلوات هر ۲۴ ساعت ارسال می‌گردد ✅');
  nextStage(ctx);
})
bot.action('48',(ctx) => { 
  dataService.setCounterInterval(ctx.chat.id, 48);
  ctx.answerCbQuery('پیام صلوات هر ۴۸ ساعت ارسال می‌گردد ✅');
  nextStage(ctx);
})
bot.startPolling()