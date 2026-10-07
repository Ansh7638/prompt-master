const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const WebSocket=require('ws');
const PORT=process.env.PORT||10000;
const DATA_DIR=path.join(__dirname,'data');
const DATA_FILE=path.join(DATA_DIR,'profiles.json');
const rooms=new Map();
const queue=[];
let profiles={};
try{fs.mkdirSync(DATA_DIR,{recursive:true});profiles=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'))||{}}catch{profiles={}}
function saveProfiles(){try{fs.mkdirSync(DATA_DIR,{recursive:true});fs.writeFileSync(DATA_FILE,JSON.stringify(profiles,null,2))}catch(e){console.error('profile save failed',e.message)}}
const QUESTION_BANK=[
['PM001','Prompting','easy','Which prompt gives the AI the clearest role?',['Tell me about space.','Act as an astronomy teacher for beginners.','Explain something interesting.','Write a long answer.'],1],
['PM002','Prompting','easy','Which requirement is most actionable for a study plan?',['Make it perfect.','Include daily topics, practice time, and review sessions.','Make it impressive.','Use lots of detail.'],1],
['PM003','Prompting','medium','Which constraint is clearest?',['Make it good.','Keep the answer under 100 words.','Be interesting.','Help me out.'],1],
['PM004','Prompting','medium','Which prompt best requests a balanced comparison?',['Tell me which is best.','Compare price, benefits, drawbacks and uncertainty in a table.','Praise the newest option.','Give no details.'],1],
['PM005','Prompting','hard','What should a strong multi-step prompt include?',['Only the final goal.','Goal, ordered steps, constraints, output format and success criteria.','More adjectives.','No method.'],1],
['PM006','Funny','easy','If a prompt says “make me famous by Friday,” what is missing?',['A time machine.','A realistic goal and strategy.','More emojis.','A louder keyboard.'],1],
['PM007','Funny','easy','Which AI request sounds most suspiciously like a lazy student?',['Teach me the topic.','Give me the answer and make it look like I studied.','Quiz me.','Explain my mistake.'],1],
['PM008','Funny','medium','You ask AI to “write the perfect excuse for being late.” What should it probably do first?',['Invent a teleportation story.','Ask for context and avoid fabricating serious claims.','Blame aliens.','Write 5,000 words.'],1],
['PM009','Funny','medium','What is the most dangerous prompt ingredient?',['Clear goals.','Confidently asking AI to guess missing facts.','A short sentence.','A numbered list.'],1],
['PM010','Funny','hard','Your prompt says “be creative, but copy this exactly.” What is the issue?',['Too many commas.','The instructions conflict.','The prompt is too short.','It needs a password.'],1],
['CE001','Competitive Exams','easy','Which Article of the Indian Constitution guarantees equality before law?',['Article 12','Article 14','Article 19','Article 21'],1],
['CE002','Competitive Exams','easy','How many Fundamental Duties are currently listed in the Indian Constitution?',['10','11','12','9'],1],
['CE003','Competitive Exams','moderate','Which body conducts elections to Parliament and State Legislatures in India?',['UPSC','Election Commission of India','Finance Commission','NITI Aayog'],1],
['CE004','Competitive Exams','hard','The anti-defection provisions are contained in which Schedule?',['Eighth','Ninth','Tenth','Twelfth'],2],
['CE005','Competitive Exams','easy','Who founded the Mauryan Empire?',['Ashoka','Chandragupta Maurya','Harsha','Samudragupta'],1],
['CE006','Competitive Exams','easy','The Quit India Movement was launched in which year?',['1930','1942','1947','1950'],1],
['CE007','Competitive Exams','moderate','The Arthashastra is traditionally associated with whom?',['Kautilya','Kalidasa','Banabhatta','Tulsidas'],0],
['CE008','Competitive Exams','hard','The Permanent Settlement was introduced under which Governor-General?',['Wellesley','Cornwallis','Dalhousie','Curzon'],1],
['CE009','Competitive Exams','easy','Which is the largest Indian state by area?',['Madhya Pradesh','Maharashtra','Rajasthan','Uttar Pradesh'],2],
['CE010','Competitive Exams','easy','Which river is known as the “Sorrow of Bihar”?',['Ganga','Kosi','Godavari','Narmada'],1],
['CE011','Competitive Exams','moderate','Black soil is particularly suitable for which crop?',['Tea','Cotton','Jute','Wheat'],1],
['CE012','Competitive Exams','hard','Which Indian state has the longest coastline?',['Tamil Nadu','Andhra Pradesh','Gujarat','Maharashtra'],2],
['CE013','Competitive Exams','easy','What is the SI unit of force?',['Joule','Watt','Newton','Pascal'],2],
['CE014','Competitive Exams','easy','Which gas is most abundant in Earth’s atmosphere?',['Oxygen','Nitrogen','Carbon dioxide','Hydrogen'],1],
['CE015','Competitive Exams','moderate','In typical eukaryotic cells, most genetic material is contained in the:',['Ribosome','Nucleus','Cell wall','Golgi apparatus'],1],
['CE016','Competitive Exams','hard','The splitting of white light into its component colours by a prism is called:',['Reflection','Dispersion','Diffraction','Interference'],1],
['CE017','Competitive Exams','easy','What is 15% of 200?',['20','25','30','35'],2],
['CE018','Competitive Exams','moderate','A vehicle travels 180 km in 3 hours. What is its average speed?',['50 km/h','60 km/h','70 km/h','80 km/h'],1],
['CE019','Competitive Exams','hard','Two numbers are in the ratio 3:5 and their sum is 64. What is the smaller number?',['18','24','30','40'],1],
['CE020','Competitive Exams','easy','Find the next number: 2, 4, 8, 16, ?',['24','28','30','32'],3],
['CE021','Competitive Exams','moderate','If CAT is coded as DBU, how is DOG coded using the same rule?',['EPH','EPG','FPH','DNG'],0],
['CE022','Competitive Exams','hard','All roses are flowers. Some flowers fade quickly. Which conclusion is definitely true?',['All roses fade quickly.','Some roses fade quickly.','No roses fade quickly.','None of these follows.'],3],
['CE023','Competitive Exams','easy','Choose the closest meaning of “abundant”.',['Rare','Plentiful','Tiny','Weak'],1],
['CE024','Competitive Exams','moderate','Which spelling is correct?',['Accomodation','Accommodation','Acommodation','Accommadation'],1],
['CE025','Competitive Exams','easy','Which device is primarily used to enter text into a computer?',['Monitor','Keyboard','Speaker','Projector'],1],
['CE026','Competitive Exams','moderate','CPU stands for:',['Central Processing Unit','Computer Personal Unit','Central Program Utility','Control Processing User'],0],
['CE027','Competitive Exams','moderate','Inflation generally refers to:',['A sustained rise in the general price level','A fall in all prices','A rise in unemployment only','A rise in exports only'],0],
['CE028','Competitive Exams','hard','GDP avoids double counting mainly by focusing on:',['Final goods and services','All intermediate sales','Only imports','Only government spending'],0],
['CE029','Competitive Exams','easy','What is the capital of India?',['Mumbai','New Delhi','Kolkata','Chennai'],1],
['CE030','Competitive Exams','hard','The Reserve Bank of India is the country’s:',['Stock exchange','Tax authority','Central bank','Planning ministry'],2],
['GK001','World Knowledge','easy','Which planet is known as the Red Planet?',['Earth','Mars','Jupiter','Venus'],1],
['GK002','World Knowledge','easy','How many continents are commonly taught in the seven-continent model?',['5','6','7','8'],2],
['GK003','World Knowledge','medium','Which ocean is the largest?',['Atlantic','Indian','Pacific','Arctic'],2],
['SCI001','Science','easy','Which organ pumps blood through the human body?',['Lungs','Heart','Liver','Kidney'],1],
['SCI002','Science','medium','Water boils at approximately what temperature at sea level?',['50°C','75°C','100°C','125°C'],2],
['TECH001','Technology','easy','What does URL stand for?',['Uniform Resource Locator','Universal Reading Link','User Route Language','Unified Remote Login'],0],
['HIS001','History','easy','The Taj Mahal was commissioned by which Mughal emperor?',['Akbar','Shah Jahan','Aurangzeb','Humayun'],1],
['SPORT001','Sports','easy','How many players from one side are on the field in a standard football (soccer) team?',['9','10','11','12'],2],
['FOOD001','Food','easy','Which ingredient is traditionally used to make hummus?',['Chickpeas','Rice','Potatoes','Corn'],0]
].map(x=>({id:x[0],category:x[1],difficulty:x[2],question:x[3],options:x[4],answer:x[5]}));
const MODES={
 'Classic Duel':{rounds:5,qPerRound:5,time:15},
 'Quick Match':{rounds:3,qPerRound:5,time:10},
 'Endless':{rounds:10,qPerRound:5,time:15},
 'Solo Practice':{rounds:5,qPerRound:5,time:30}
};
const CATEGORIES=['Mixed Quiz','Prompting','Funny','Competitive Exams','World Knowledge','Science','Technology','History','Sports','Food'];
function uid(){return crypto.randomBytes(9).toString('hex')}
function code(){let s='';const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';do{s='';for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)]}while(rooms.has(s));return s}
function shuffle(a){return [...a].sort(()=>Math.random()-0.5)}
function levelFor(xp){return Math.floor(xp/500)+1}
function profileFor(name,accountId){const id=accountId||'guest_'+uid();if(!profiles[id])profiles[id]={id,name:String(name||'Player').slice(0,20),xp:0,wins:0,losses:0,games:0,streak:0,bestStreak:0,badges:[],missions:{games:0,correct:0},createdAt:Date.now()};return profiles[id]}
function addProgress(p,correct,win){p.games++;p.missions.games++;if(correct)p.missions.correct++;p.xp+=correct?25:5;if(correct){p.streak++;p.bestStreak=Math.max(p.bestStreak,p.streak)}else p.streak=0;if(win)p.wins++;else p.losses++;const level=levelFor(p.xp);if(level>=5&&!p.badges.includes('Level 5'))p.badges.push('Level 5');if(p.missions.correct>=20&&!p.badges.includes('20 Correct'))p.badges.push('20 Correct');saveProfiles()}
function poolFor(category){if(category&&category!=='Mixed Quiz')return QUESTION_BANK.filter(q=>q.category===category);return QUESTION_BANK}
function makeQuestions(category,mode){const cfg=MODES[mode]||MODES['Classic Duel'];const pool=poolFor(category);const rules=[['easy'],['easy','medium'],['medium'],['medium','hard'],['hard'],['medium','hard'],['easy','hard'],['medium','hard'],['easy','medium','hard'],['hard']];let out=[];for(let r=0;r<cfg.rounds;r++){let allowed=rules[Math.min(r,rules.length-1)];let eligible=pool.filter(q=>allowed.includes(q.difficulty));if(eligible.length<cfg.qPerRound)eligible=pool;let used=[];for(let i=0;i<cfg.qPerRound;i++){if(!eligible.length)break;let q=eligible.find(x=>!used.includes(x.id))||eligible[i%eligible.length];used.push(q.id);out.push({...q,round:r});}}return out}
function publicProfile(p){return {id:p.id,name:p.name,xp:p.xp,level:levelFor(p.xp),wins:p.wins,losses:p.losses,games:p.games,streak:p.streak,bestStreak:p.bestStreak,badges:p.badges,missions:p.missions}}
function send(ws,msg){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(msg))}
function broadcast(room,msg){room.players.forEach(p=>send(p.ws,msg))}
function cancelTimer(p){if(p.timer)clearTimeout(p.timer);p.timer=null}
function publicState(room,p){const q=p.index<room.questions.length?room.questions[p.index]:null;return {type:'state',status:room.players.length<2?'waiting':(p.index>=room.questions.length?'finished':'playing'),roomCode:room.code,mode:room.mode,category:room.category,players:room.players.map(x=>({id:x.id,name:x.name,score:x.score,streak:x.streak,index:x.index,finished:x.index>=room.questions.length})),index:p.index,total:room.questions.length,round:Math.floor(p.index/(MODES[room.mode].qPerRound))+1,question:q?{category:q.category,difficulty:q.difficulty,question:q.question,options:q.options}:null,deadline:p.deadline}}
function sendState(room,p){send(p.ws,publicState(room,p))}
function startTimer(room,p){cancelTimer(p);if(p.index>=room.questions.length)return;p.deadline=Date.now()+room.time*1000;p.timer=setTimeout(()=>{if(p.answered||p.index>=room.questions.length)return;p.answered=true;p.streak=0;send(p.ws,{type:'answerResult',correct:false,points:0,timeout:true});advance(room,p)},room.time*1000)}
function advance(room,p){cancelTimer(p);p.answered=false;p.index++;p.deadline=null;if(p.index<room.questions.length)startTimer(room,p);sendState(room,p);if(p.index>=room.questions.length&&room.players.length===1){addProgress(p.profile,p.correctAnswers,true);send(p.ws,{type:'finished',players:[{name:p.name,score:p.score,correct:p.correctAnswers,profile:publicProfile(p.profile)}]});return}if(room.players.length===2&&room.players.every(x=>x.index>=room.questions.length)){const high=Math.max(...room.players.map(y=>y.score));room.players.forEach(x=>addProgress(x.profile,x.correctAnswers,x.score===high));broadcast(room,{type:'finished',players:room.players.map(x=>({name:x.name,score:x.score,correct:x.correctAnswers,profile:publicProfile(x.profile)}))})}}
function createPlayer(ws,name,profile,room){return {id:uid(),name:String(name||profile.name||'Player').slice(0,20),score:0,streak:0,correctAnswers:0,index:0,answered:false,deadline:null,timer:null,ws,room,profile}}
function leaderboard(){return Object.values(profiles).sort((a,b)=>b.xp-a.xp).slice(0,20).map((p,i)=>({rank:i+1,...publicProfile(p)}))}
function serve(req,res){let p=req.url.split('?')[0];if(p==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,rooms:rooms.size,players:Object.keys(profiles).length}))}if(p==='/api/categories'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify(CATEGORIES))}if(p==='/api/leaderboard'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify(leaderboard()))}if(p==='/')p='/index.html';const safe=path.normalize(p).replace(/^([.][.][/\\])+/, '');const file=path.join(__dirname,'public',safe);fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end('Not found')}const ext=path.extname(file);const ct=ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.json'?'application/json':'application/octet-stream';res.writeHead(200,{'content-type':ct});res.end(data)})}
const server=http.createServer(serve);const wss=new WebSocket.Server({server});
wss.on('connection',ws=>{let player=null;ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
 if(m.type==='guest'){const p=profileFor(m.name);player=createPlayer(ws,m.name,p,null);send(ws,{type:'profile',profile:publicProfile(p)});return}
 if(m.type==='login'){const p=profiles[String(m.id||'')];if(!p)return send(ws,{type:'error',message:'Account not found.'});player=createPlayer(ws,p.name,p,null);send(ws,{type:'profile',profile:publicProfile(p)});return}
 if(m.type==='register'){const name=String(m.name||'').trim();if(name.length<2)return send(ws,{type:'error',message:'Enter a name of at least 2 characters.'});const p=profileFor(name);player=createPlayer(ws,name,p,null);send(ws,{type:'registered',profile:publicProfile(p)});return}
 if(m.type==='leaderboard')return send(ws,{type:'leaderboard',rows:leaderboard()});
 if(m.type==='create'){const profile=player?.profile||profileFor(m.name);player=createPlayer(ws,m.name,profile,null);const mode=MODES[m.mode]?m.mode:'Classic Duel';const category=CATEGORIES.includes(m.category)?m.category:'Mixed Quiz';const room={code:code(),players:[],questions:makeQuestions(category,mode),mode,category,time:MODES[mode].time};player.room=room;room.players.push(player);rooms.set(room.code,room);send(ws,{type:'created',code:room.code,playerId:player.id,mode,category,time:room.time});sendState(room,player);return}
 if(m.type==='matchmake'){const profile=player?.profile||profileFor(m.name);player=createPlayer(ws,m.name,profile,null);const found=queue.findIndex(x=>x.mode===m.mode&&x.category===m.category&&x.ws.readyState===WebSocket.OPEN);if(found>=0){const other=queue.splice(found,1)[0];const mode=MODES[m.mode]?m.mode:'Classic Duel';const category=CATEGORIES.includes(m.category)?m.category:'Mixed Quiz';const room={code:code(),players:[],questions:makeQuestions(category,mode),mode,category,time:MODES[mode].time};other.room=room;player.room=room;room.players.push(other,player);rooms.set(room.code,room);room.players.forEach(x=>{send(x.ws,{type:'matched',code:room.code,mode,category});startTimer(room,x);sendState(room,x)});return}queue.push({ws,mode:m.mode||'Classic Duel',category:m.category||'Mixed Quiz'});send(ws,{type:'queued',message:'Looking for an opponent…'});return}
 if(m.type==='join'){const room=rooms.get(String(m.code||'').toUpperCase());if(!room)return send(ws,{type:'error',message:'Room not found.'});if(room.players.length>=2)return send(ws,{type:'error',message:'Room is full.'});const profile=player?.profile||profileFor(m.name);player=createPlayer(ws,m.name,profile,room);room.players.push(player);room.players.forEach(x=>{if(room.players.length===2&&x.index<room.questions.length)startTimer(room,x);sendState(room,x)});return}
 if(!player)return send(ws,{type:'error',message:'Start as a guest or create an account first.'});
 if(m.type==='answer'){const room=player.room;if(!room||room.players.length!==2||player.answered||player.index>=room.questions.length)return;const q=room.questions[player.index];const n=Number(m.answer);player.answered=true;cancelTimer(player);const correct=n===q.answer;let pts=0;if(correct){pts=100+player.streak*25+Math.max(0,Math.ceil(((player.deadline-Date.now())/1000))*2);player.score+=pts;player.streak++;player.correctAnswers++}else player.streak=0;send(player.ws,{type:'answerResult',correct,points:pts,answer:q.answer,explanation:q.explanation||''});advance(room,player);return}
 if(m.type==='solo'){const profile=player?.profile||profileFor(m.name);player=createPlayer(ws,m.name,profile,null);const mode='Solo Practice';const category=CATEGORIES.includes(m.category)?m.category:'Mixed Quiz';const room={code:'SOLO',players:[player],questions:makeQuestions(category,mode),mode,category,time:MODES[mode].time};player.room=room;startTimer(room,player);send(ws,{type:'soloStarted',mode,category});sendState(room,player);return}
 if(m.type==='profile'){return send(ws,{type:'profile',profile:publicProfile(player.profile)})}
 });ws.on('close',()=>{if(player?.room){const room=player.room;cancelTimer(player);room.players=room.players.filter(x=>x!==player);if(room.code!=='SOLO'&&room.players.length){send(room.players[0].ws,{type:'opponentLeft'});sendState(room,room.players[0])}else if(room.code!=='SOLO')rooms.delete(room.code)}for(let i=queue.length-1;i>=0;i--)if(queue[i].ws===ws)queue.splice(i,1)})});
server.listen(PORT,'0.0.0.0',()=>console.log('Prompt Master platform listening on '+PORT));
