const Telegraf = require('telegraf')
const {Markup} = Telegraf
const config = require('./config')
const bot = new Telegraf(config.botToken)
const fetch = require('node-fetch');
const session = require('telegraf/session')
const chalk = require('chalk'); // debug purposes
const dataservice = require('./dataserviceold')

const log = console.log;

var globalCounter = 0;
bot.use(session())
// load users into an array
dataservice.loadUsers();
// keep the refrence of timers
var timers = {}
// useful functions and utilities
function toPersianDigits(str){
    var num = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹']
    str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return str.replace(/[0-9]/g, function(w){return num[+w]})
}
function hourToMillis(String){
  return parseInt(String) * 60 * 60 * 1000
}
async function showMainScene(ctx){
  ctx.deleteMessage(dataservice.getActiveMessageId(ctx.update.message.chat.id)).catch((e) => {console.log('previous message not found')})
  await fetch('https://api.salav.at/data/salavat/count.json?pwa')
      .then(res => res.json())
      .then(body => {
        globalCounter = body.salavatCount.count
   })
   ctx.reply(
    `همین الان برای سلامتی و فرج امام‌زمان علیه‌السلام صلوات بفرست` + '\n' + ` توی سایت salav.at ثبت میشه`,
    Markup.inlineKeyboard([
        Markup.callbackButton('یه ‌دونه فرستادم', 'one'),
        Markup.callbackButton('ده ‌تا فرستادم', 'ten'),
        Markup.callbackButton(showChatCounter(ctx), 'show'),
        Markup.urlButton(`تعداد کل صلوات ها  ${toPersianDigits(globalCounter.toString())}`, 'https://salav.at')
    ],{columns: 1}).extra()
  ).then((ctx)=>{
    dataservice.setActiveMessageId(ctx.chat.id.toString(),ctx.message_id.toString())
  })
  bot.action(['one','ten'],function(cbx){
    switch(cbx.update.callback_query.data){
      case 'one':
          postData(ctx,cbx,1)
          break;
      case 'ten':
          postData(ctx,cbx,10)
          break;
    }
  })
}
function showConfigScene(ctx){
  ctx.reply(
    `فاصله‌ی زمانی ارسال پیام نذر صلوات، توسط ربات را انتخاب نمایید:`,
    Markup.inlineKeyboard([
        Markup.callbackButton('هر ۶ ساعت ⌚', '6'),
        Markup.callbackButton('هر ۱۲ ساعت ⌚', '12'),
        Markup.callbackButton('هر ۲۴ ساعت ⌚', '24'),
        Markup.callbackButton('هر ۴۸ ساعت ⌚', '48'),
      ],{columns: 1}).extra()
    ).then((ctx)=>{
      dataservice.setActiveMessageId(ctx.chat.id.toString(),ctx.message_id.toString())
    })
    bot.action(['6','12','24','48'],function(cbx){
      switch(cbx.update.callback_query.data){
        case '6':
            dataservice.setCounterInterval(cbx.chat.id, 6)
            cbx.answerCbQuery('پیام صلوات هر ۶ ساعت ارسال می‌گردد ✅')
            break;
        case '12':
            dataservice.setCounterInterval(cbx.chat.id, 12)
            cbx.answerCbQuery('پیام صلوات هر ۱۲ ساعت ارسال می‌گردد ✅')
            break;
        case '24':
            dataservice.setCounterInterval(cbx.chat.id, 24);
            cbx.answerCbQuery('پیام صلوات هر ۲۴ ساعت ارسال می‌گردد ✅')
            break;
        case '48':
            dataservice.setCounterInterval(cbx.chat.id, 48);
            cbx.answerCbQuery('پیام صلوات هر ۴۸ ساعت ارسال می‌گردد ✅')
            break;
      }
      showMainScene(ctx)
      timers[ctx.update.message.chat.id] = setInterval(function(){
        showMainScene(ctx)
      },hourToMillis(dataservice.getCounterInterval(ctx.update.message.chat.id)))
    })
}
//
// functions for returning frequent string templates
function showChatCounter(ctx){
    switch(dataservice.getChatType(ctx.update.message.chat.id)){
      case 'private':
        return   `شما تا الان ${toPersianDigits(dataservice.getCounter(ctx.update.message.chat.id).toString())} صلوات فرستاده‌اید`
      case 'group':
        return   `در این گروه تا الان ${toPersianDigits(dataservice.getCounter(ctx.update.message.chat.id).toString())} صلوات فرستاده شده`
      case 'channel':
        return   `در این کانال تا الان ${toPersianDigits(dataservice.getCounter(ctx.update.message.chat.id).toString())} صلوات فرستاده شده`
    }
  }

function postData(ctx,cbx,int){
  const requestBody = {
    data: { count: int, _id: "salavatCount" },
    docId: "salavat/count",
    token: config.salavatToken
  };
  fetch('https://api.salav.at/v1/update-data', {
    method: 'post',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(res => res.json())
    .then(json => {
      dataservice.setCounter(ctx.update.message.chat.id,dataservice.getCounter(ctx.update.message.chat.id) + int)
      cbx.editMessageText(
        `همین الان برای سلامتی و فرج امام‌زمان علیه‌السلام صلوات بفرست` + '\n' + ` توی سایت salav.at ثبت میشه`,
        Markup.inlineKeyboard([
            Markup.callbackButton('یه ‌دونه فرستادم', 'one'),
            Markup.callbackButton('ده ‌تا فرستادم', 'ten'),
            Markup.callbackButton(showChatCounter(ctx), 'show'),
            Markup.urlButton(`تعداد کل صلوات ها  ${toPersianDigits(json.data.count.toString())}`, 'https://salav.at')
        ],{columns: 1}).extra()
      )

      int == 1 ?   cbx.answerCbQuery('یک صلوات شما با موفقیت ثبت شد ✅') :   cbx.answerCbQuery('ده صلوات شما با موفقیت ثبت شد ✅');
    });
}
// help command
const helpMessage = `🔻 با اضافه کردن این روبات به گروه‌ها و کانال‌های خودتون، توی فواصل زمانی دلخواه، پیام نذر صلوات به صورت اتوماتیک ارسال میشه.
برای شروع 
/start@Salav_at_bot
رو بزنید`
bot.command(['help','help@Salav_at_bot'],(ctx) => {ctx.reply(helpMessage)})
// launching bot
bot.command(['setting','setting@Salav_at_bot'],(ctx) => {
  clearInterval(timers[ctx.update.message.chat.id])
  showConfigScene(ctx)})


bot.command(['start@Salav_at_bot','start'],(ctx) => {
  var userList = dataservice.getUserList();
  // checks wether the user is available in the JSON file or not
  if(userList.includes(ctx.update.message.chat.id.toString())){
      showMainScene(ctx)
    timers[ctx.update.message.chat.id] = setInterval(function(){
      showMainScene(ctx)
    },hourToMillis(dataservice.getCounterInterval(ctx.update.message.chat.id)))
  } else {
    // registering a new user
    dataservice.registerUser(ctx.update.message)
    showConfigScene(ctx)
  }
})
bot.command(['stop@Salav_at_bot','stop'],(ctx) => {
  clearInterval(timers[ctx.update.message.chat.id])
})

bot.launch()
