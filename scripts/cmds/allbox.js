const moment=require("moment-timezone");

module.exports = {
  config: {
    name: "allbox",
    aliases: ["allgroup", "grouping"],
    version: "1.5.0",
    author: " SK-SIDDIK-KHAN",
    countDown: 5,
    role: 2,
    usePrefix: true,
    description: {
            en: "List all groups and reply with ban / unban / del / out + number or all",
            bn: "সব গ্রুপ লিস্ট করে ban/unban/del/out করতে পারবেন"
        },
        category: "owner",
        guide: {
            en: "{pn} [page number]\nReply: ban/unban/del/out <number|all>",
            bn: "{pn} [page number]\nরিপ্লাই: ban/unban/del/out <number|all>"
        }
},
    langs: {
        en: { syntaxError: "Please use the correct syntax: {pn}!" },
        bn: { syntaxError: "দয়া করে সঠিক সিনট্যাক্স ব্যবহার করুন: {pn}!" }
    },

onStart:async function({event,api,message,threadsData,commandName,args}){
try{
let groups=await threadsData.getAll();
groups=groups.filter(g=>g&&g.threadID&&(g.isGroup===true||g.threadName));

if(!groups.length)return message.reply(`┌────────────⭓
│ ❌ 𝐆𝐑𝐎𝐔𝐏 𝐍𝐎𝐓 𝐅𝐎𝐔𝐍𝐃
├────────────
│ Currently no groups found
│ in the database.
└────────────⭓`);

groups.sort((a,b)=>(b.messageCount||0)-(a.messageCount||0));

const page=Math.max(1,parseInt(args[0])||1),perPage=20,totalPage=Math.ceil(groups.length/perPage)||1,start=(page-1)*perPage,pageGroups=groups.slice(start,start+perPage);

if(!pageGroups.length)return message.reply(`┌────────────⭓
│ ❌ 𝐏𝐀𝐆𝐄 𝐍𝐎𝐓 𝐅𝐎𝐔𝐍𝐃
├────────────
│ 📄 Requested Page: ${page}
│ 📚 Total Pages: ${totalPage}
│
│ Please use a valid page number.
└────────────⭓`);

let msg=`┌────────────⭓
│ 🎭 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓
├────────────
│ 📄 𝐏𝐚𝐠𝐞: ${page}/${totalPage}
│ 👥 𝐓𝐨𝐭𝐚𝐥: ${groups.length}
│`,groupid=[],groupName=[];

pageGroups.forEach((g,i)=>{
const idx=start+i+1,name=g.threadName||g.name||"Unknown",count=g.messageCount??g.members?.length??"?",banned=g.banned?.status?"🚫":"🟢";
msg+=`
│
│ ${idx}. ${banned} ${name}
│ ├─ 🔰 𝐓𝐈𝐃: ${g.threadID}
│ └─ 💌 𝐌𝐬𝐠/𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${count}`;
groupid.push(String(g.threadID));groupName.push(name);
});

msg+=`
│
├────────────
│ 💬 𝐑𝐄𝐏𝐋𝐘 𝐂𝐎𝐌𝐌𝐀𝐍𝐃
│
│ ├─ 🔨 ban <number|all>
│ ├─ 🔓 unban <number|all>
│ ├─ 🗑️ del <number|all>
│ └─ 🚪 out <number|all>
└────────────⭓`;

const info=await message.reply(msg);

global.GoatBot.onReply.set(info.messageID,{
commandName,messageID:info.messageID,author:event.senderID,groupid,groupName,page,start,
unsendTimeout:setTimeout(()=>{api.unsendMessage?.(info.messageID).catch(()=>{});},this.config.countDown*1000)
});

}catch(error){
console.error("allbox error:",error);
return message.reply(`┌────────────⭓
│ ❌ 𝐀𝐋𝐋𝐁𝐎𝐗 𝐄𝐑𝐑𝐎𝐑
├────────────
│ Failed to fetch group list.
│
│ ⚠️ ${error.message||error}
└────────────⭓`);
}
},

onReply:async function({event,Reply,api,message,threadsData}){
const{author,groupid,groupName,messageID,start=0}=Reply;
if(String(event.senderID)!==String(author))return;

clearTimeout(Reply.unsendTimeout);

const body=(event.body||"").trim().toLowerCase(),args=body.split(/\s+/),action=args[0],target=args[1];

if(!["ban","unban","del","out"].includes(action))return message.reply(`┌────────────⭓
│ ❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐀𝐂𝐓𝐈𝐎𝐍
├────────────
│ Use one of:
│
│ 🔨 ban
│ 🔓 unban
│ 🗑️ del
│ 🚪 out
│
│ 📌 Example:
│ ➜ ban 5
│ ➜ out all
└────────────⭓`);

if(!target)return message.reply(`┌────────────⭓
│ ❌ 𝐌𝐈𝐒𝐒𝐈𝐍𝐆 𝐓𝐀𝐑𝐆𝐄𝐓
├────────────
│ Please provide a number
│ or use "all".
│
│ 📌 Example:
│ ➜ ban 5
│ ➜ unban all
└────────────⭓`);

const processOne=async i=>{
const idgr=groupid[i],gName=groupName[i];
if(!idgr)return{success:false,text:"❌ Invalid group index"};

try{
if(action==="ban"){
await threadsData.set(idgr,{banned:{status:true,reason:"Banned by allbox command",date:moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY")}});
return{success:true,text:`🔨 𝐁𝐚𝐧𝐧𝐞𝐝: ${gName}`};
}

if(action==="unban"){
await threadsData.set(idgr,{banned:{status:false,reason:null,date:null}});
return{success:true,text:`🔓 𝐔𝐧𝐛𝐚𝐧𝐧𝐞𝐝: ${gName}`};
}

if(action==="del"){
if(typeof threadsData.remove==="function")await threadsData.remove(idgr);
else await threadsData.set(idgr,{data:{},members:[],banned:{status:false}});
return{success:true,text:`🗑️ 𝐃𝐚𝐭𝐚 𝐃𝐞𝐥𝐞𝐭𝐞𝐝: ${gName}`};
}

if(action==="out"){
if(typeof api.leaveChat==="function")await api.leaveChat(idgr);
else if(typeof api.removeUserFromGroup==="function")await api.removeUserFromGroup(api.getCurrentUserID(),idgr);
else throw new Error("No leave method found");
return{success:true,text:`🚪 𝐁𝐨𝐭 𝐋𝐞𝐟𝐭: ${gName}`};
}

}catch(err){
console.error(`allbox ${action} error on ${idgr}:`,err);
return{success:false,text:`❌ 𝐅𝐚𝐢𝐥𝐞𝐝 ${action}: ${gName}\n   ↳ ${err.message||err}`};
}
};

if(target==="all"){
const results=[];
for(let i=0;i<groupid.length;i++){const res=await processOne(i);results.push(res.text);}

const icon=action==="ban"?"🔨":action==="unban"?"🔓":action==="del"?"🗑️":"🚪",
shownResults=results.slice(0,15).join("\n│ "),
more=results.length>15?`\n│ ... and ${results.length-15} more`:"";

await message.reply(`┌────────────⭓
│ ${icon} 𝐀𝐋𝐋 ${action.toUpperCase()}
├────────────
│ 📊 𝐏𝐫𝐨𝐜𝐞𝐬𝐬𝐞𝐝: ${groupid.length} groups
│
│ ${shownResults}${more}
├────────────
│ ✅ 𝐏𝐫𝐨𝐜𝐞𝐬𝐬 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞
└────────────⭓`);

}else{
const absoluteIndex=parseInt(target);

if(isNaN(absoluteIndex))return message.reply(`┌────────────⭓
│ ❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐍𝐔𝐌𝐁𝐄𝐑
├────────────
│ Please use a valid group
│ number from the current page.
│
│ 📌 Example:
│ ➜ ban 5
└────────────⭓`);

const localIndex=absoluteIndex-start-1;

if(localIndex<0||localIndex>=groupid.length)return message.reply(`┌────────────⭓
│ ❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐍𝐔𝐌𝐁𝐄𝐑
├────────────
│ Use a number from the
│ current page list.
│
│ 📄 Current Page:
│ ${start+1} - ${start+groupid.length}
└────────────⭓`);

const res=await processOne(localIndex);

await message.reply(`┌────────────⭓
│ ${res.success?"✅":"❌"} 𝐀𝐂𝐓𝐈𝐎𝐍 𝐑𝐄𝐒𝐔𝐋𝐓
├────────────
│ ${res.text.replace(/\n/g,"\n│ ")}
├────────────
│ ${res.success?"✨ Operation completed":"⚠️ Operation failed"}
└────────────⭓`);
}

try{await api.unsendMessage(messageID);}catch(_){}
}
};
