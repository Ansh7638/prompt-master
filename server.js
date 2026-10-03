const http=require('http');
const fs=require('fs');
const path=require('path');
const WebSocket=require('ws');
const PORT=process.env.PORT||10000;
const rooms=new Map();
const QUESTION_BANK = [
  {
    "id": "R1-01",
    "round": 1,
    "category": "Role",
    "difficulty": "easy",
    "question": "Which prompt gives the AI the clearest role?",
    "options": [
      "Tell me about space.",
      "Act as an astronomy teacher for beginners.",
      "Explain something interesting.",
      "Write a long answer."
    ],
    "answer": 1
  },
  {
    "id": "R1-02",
    "round": 1,
    "category": "Role",
    "difficulty": "easy",
    "question": "You need feedback on a CV. Which role is most useful?",
    "options": [
      "Act as an experienced recruitment specialist.",
      "Act as a chef.",
      "Act as a travel blogger.",
      "Act as a game show host."
    ],
    "answer": 0
  },
  {
    "id": "R1-03",
    "round": 1,
    "category": "Role",
    "difficulty": "medium",
    "question": "Which role best fits a request to explain a bug to a beginner?",
    "options": [
      "A strict judge",
      "A patient programming tutor",
      "A sports commentator",
      "A poet with no technical focus"
    ],
    "answer": 1
  },
  {
    "id": "R1-04",
    "round": 1,
    "category": "Role",
    "difficulty": "medium",
    "question": "Which role would best help plan a low-cost family trip?",
    "options": [
      "Luxury brand designer",
      "Budget-conscious travel planner",
      "Film critic",
      "Laboratory researcher"
    ],
    "answer": 1
  },
  {
    "id": "R1-05",
    "round": 1,
    "category": "Role",
    "difficulty": "hard",
    "question": "A team needs a balanced review of a product launch. Which role is most suitable?",
    "options": [
      "A fan who loves the product",
      "A skeptical competitor",
      "A product strategist who weighs customer needs, risks, and evidence",
      "A salesperson whose only goal is to praise it"
    ],
    "answer": 2
  },
  {
    "id": "R1-06",
    "round": 1,
    "category": "Role",
    "difficulty": "easy",
    "question": "What is the main purpose of adding a role to a prompt?",
    "options": [
      "To guarantee every fact is correct",
      "To guide the AI's perspective and style",
      "To make the prompt longer",
      "To remove the need for details"
    ],
    "answer": 1
  },
  {
    "id": "R1-07",
    "round": 1,
    "category": "Role",
    "difficulty": "hard",
    "question": "You want a science explanation for a 10-year-old without losing accuracy. Which role is best?",
    "options": [
      "A sensational news writer",
      "A science educator skilled at age-appropriate explanations",
      "A comedian who avoids facts",
      "An academic who uses unexplained jargon"
    ],
    "answer": 1
  },
  {
    "id": "R1-08",
    "round": 1,
    "category": "Role",
    "difficulty": "medium",
    "question": "Which prompt role is most appropriate for checking whether a claim is supported by sources?",
    "options": [
      "Fact-checking editor",
      "Fantasy novelist",
      "Wedding planner",
      "Interior decorator"
    ],
    "answer": 0
  },
  {
    "id": "R2-01",
    "round": 2,
    "category": "Requirements",
    "difficulty": "easy",
    "question": "Which prompt states a clear requirement?",
    "options": [
      "Make it nice.",
      "Write a 150-word product description for a reusable water bottle.",
      "Do something useful.",
      "Use your imagination."
    ],
    "answer": 1
  },
  {
    "id": "R2-02",
    "round": 2,
    "category": "Requirements",
    "difficulty": "easy",
    "question": "You ask for a study plan. Which extra requirement is most actionable?",
    "options": [
      "Make it perfect.",
      "Include daily topics, practice time, and review sessions.",
      "Make it impressive.",
      "Use lots of detail."
    ],
    "answer": 1
  },
  {
    "id": "R2-03",
    "round": 2,
    "category": "Requirements",
    "difficulty": "medium",
    "question": "Which requirement best clarifies a comparison task?",
    "options": [
      "Compare these laptops somehow.",
      "Compare price, battery life, weight, and repairability in a table.",
      "Tell me everything.",
      "Pick the coolest one."
    ],
    "answer": 1
  },
  {
    "id": "R2-04",
    "round": 2,
    "category": "Requirements",
    "difficulty": "medium",
    "question": "You need a professional email declining an invitation. What requirement matters most?",
    "options": [
      "Include a polite decline and a brief expression of thanks.",
      "Make it mysterious.",
      "Add unrelated background.",
      "Use as many words as possible."
    ],
    "answer": 0
  },
  {
    "id": "R2-05",
    "round": 2,
    "category": "Requirements",
    "difficulty": "hard",
    "question": "Which requirement makes a research summary easiest to verify?",
    "options": [
      "Make the summary insightful.",
      "Separate established findings from uncertainties and cite sources for factual claims.",
      "Sound confident.",
      "Include advanced vocabulary."
    ],
    "answer": 1
  },
  {
    "id": "R2-06",
    "round": 2,
    "category": "Requirements",
    "difficulty": "easy",
    "question": "What is a requirement in a prompt?",
    "options": [
      "A specific thing the output must include or accomplish",
      "A random fact about the user",
      "A decorative emoji",
      "A hidden scoring rule"
    ],
    "answer": 0
  },
  {
    "id": "R2-07",
    "round": 2,
    "category": "Requirements",
    "difficulty": "hard",
    "question": "You want a beginner workout plan. Which set of requirements is most useful?",
    "options": [
      "Make it motivating.",
      "Give a weekly schedule, exercise names, sets or duration, rest days, and beginner modifications.",
      "Make it intense.",
      "Mention fitness."
    ],
    "answer": 1
  },
  {
    "id": "R2-08",
    "round": 2,
    "category": "Requirements",
    "difficulty": "medium",
    "question": "Which requirement best supports an accessible presentation?",
    "options": [
      "Use beautiful slides.",
      "Provide concise slide titles, alt text suggestions, and high-contrast design guidance.",
      "Make it modern.",
      "Use more animations."
    ],
    "answer": 1
  },
  {
    "id": "R3-01",
    "round": 3,
    "category": "Constraints",
    "difficulty": "easy",
    "question": "Which is a clear constraint?",
    "options": [
      "Make it good.",
      "Keep the answer under 100 words.",
      "Be interesting.",
      "Help me out."
    ],
    "answer": 1
  },
  {
    "id": "R3-02",
    "round": 3,
    "category": "Constraints",
    "difficulty": "easy",
    "question": "You need a meal plan but cannot eat peanuts. What should you add?",
    "options": [
      "Make it tasty.",
      "Exclude peanuts and peanut-derived ingredients.",
      "Use bright colors.",
      "Make it exciting."
    ],
    "answer": 1
  },
  {
    "id": "R3-03",
    "round": 3,
    "category": "Constraints",
    "difficulty": "medium",
    "question": "Which constraint best fits a presentation for busy executives?",
    "options": [
      "Use no more than six slides and put the key recommendation first.",
      "Make it powerful.",
      "Include all possible details.",
      "Use a dramatic story."
    ],
    "answer": 0
  },
  {
    "id": "R3-04",
    "round": 3,
    "category": "Constraints",
    "difficulty": "medium",
    "question": "A user asks for a solution using only free tools. Which instruction is clearest?",
    "options": [
      "Keep it cheap.",
      "Use only tools with a free plan; identify any feature limits or paid upgrades.",
      "Use popular tools.",
      "Avoid expensive-looking tools."
    ],
    "answer": 1
  },
  {
    "id": "R3-05",
    "round": 3,
    "category": "Constraints",
    "difficulty": "hard",
    "question": "Which constraint reduces the risk of made-up facts in a report?",
    "options": [
      "Write confidently.",
      "If reliable evidence is unavailable, say so instead of inventing facts or citations.",
      "Make the report persuasive.",
      "Use formal language."
    ],
    "answer": 1
  },
  {
    "id": "R3-06",
    "round": 3,
    "category": "Constraints",
    "difficulty": "easy",
    "question": "How do constraints differ from requirements?",
    "options": [
      "Constraints set boundaries; requirements describe what to deliver.",
      "They mean exactly the same thing.",
      "Constraints are always optional.",
      "Requirements only concern word count."
    ],
    "answer": 0
  },
  {
    "id": "R3-07",
    "round": 3,
    "category": "Constraints",
    "difficulty": "hard",
    "question": "You need a Python example for a class using no external libraries. Which constraint is best?",
    "options": [
      "Keep the code elegant.",
      "Use only Python's standard library and explain how to run the example.",
      "Make it advanced.",
      "Include many features."
    ],
    "answer": 1
  },
  {
    "id": "R3-08",
    "round": 3,
    "category": "Constraints",
    "difficulty": "medium",
    "question": "Which constraint is most useful for a spoiler-free movie review?",
    "options": [
      "Be entertaining.",
      "Do not reveal plot twists or events beyond the film's premise.",
      "Keep it positive.",
      "Mention the cast."
    ],
    "answer": 1
  },
  {
    "id": "R4-01",
    "round": 4,
    "category": "Plan",
    "difficulty": "easy",
    "question": "Which instruction asks the AI for a plan?",
    "options": [
      "Define photosynthesis.",
      "Break the project into steps with a timeline and milestones.",
      "Use a friendly tone.",
      "Keep it short."
    ],
    "answer": 1
  },
  {
    "id": "R4-02",
    "round": 4,
    "category": "Plan",
    "difficulty": "easy",
    "question": "You want to learn basic coding in a month. Which plan request is most useful?",
    "options": [
      "Tell me coding is fun.",
      "Create a four-week schedule with practice tasks and weekly checkpoints.",
      "List famous programmers.",
      "Explain every programming language."
    ],
    "answer": 1
  },
  {
    "id": "R4-03",
    "round": 4,
    "category": "Plan",
    "difficulty": "medium",
    "question": "Which project plan is easiest to follow?",
    "options": [
      "Do research, then build something.",
      "List tasks in order, estimate durations, identify dependencies, and define completion criteria.",
      "Work hard every day.",
      "Start wherever seems best."
    ],
    "answer": 1
  },
  {
    "id": "R4-04",
    "round": 4,
    "category": "Plan",
    "difficulty": "medium",
    "question": "A small business wants to launch a website. What should the plan include first?",
    "options": [
      "Buy every available tool.",
      "Clarify goals, audience, content, budget, and launch deadline.",
      "Choose random colors.",
      "Write code immediately."
    ],
    "answer": 1
  },
  {
    "id": "R4-05",
    "round": 4,
    "category": "Plan",
    "difficulty": "hard",
    "question": "A plan depends on receiving data from another team. What should a robust plan do?",
    "options": [
      "Ignore the dependency.",
      "Identify the dependency, owner, due date, and a fallback if it is delayed.",
      "Assume it arrives early.",
      "Remove all milestones."
    ],
    "answer": 1
  },
  {
    "id": "R4-06",
    "round": 4,
    "category": "Plan",
    "difficulty": "easy",
    "question": "What makes a plan more actionable?",
    "options": [
      "Vague encouragement",
      "Specific steps, deadlines, and checkpoints",
      "A long introduction",
      "Unrelated background"
    ],
    "answer": 1
  },
  {
    "id": "R4-07",
    "round": 4,
    "category": "Plan",
    "difficulty": "hard",
    "question": "A project is behind schedule. Which plan request is most helpful?",
    "options": [
      "Tell the team to hurry.",
      "Reassess remaining tasks, dependencies, critical milestones, and scope trade-offs; then propose a revised schedule.",
      "Add more tasks.",
      "Pretend the deadline has changed."
    ],
    "answer": 1
  },
  {
    "id": "R4-08",
    "round": 4,
    "category": "Plan",
    "difficulty": "medium",
    "question": "Which plan best helps someone prepare for an exam in 10 days?",
    "options": [
      "Study everything.",
      "Create a 10-day revision calendar that prioritizes weak topics, practice tests, and rest.",
      "Read motivational quotes.",
      "Study only the easiest topic."
    ],
    "answer": 1
  },
  {
    "id": "R5-01",
    "round": 5,
    "category": "Mixed",
    "difficulty": "easy",
    "question": "Which prompt combines a role and a clear requirement?",
    "options": [
      "Help with writing.",
      "Act as an editor and rewrite this paragraph in 3 concise sentences.",
      "Write something good.",
      "Be creative."
    ],
    "answer": 1
  },
  {
    "id": "R5-02",
    "round": 5,
    "category": "Mixed",
    "difficulty": "easy",
    "question": "Which prompt has a clear audience and format?",
    "options": [
      "Explain budgeting.",
      "Explain budgeting to a 14-year-old using five bullets and one simple example.",
      "Make money easier.",
      "Tell me useful things."
    ],
    "answer": 1
  },
  {
    "id": "R5-03",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "Choose the strongest prompt for planning a weekend trip.",
    "options": [
      "Plan a trip.",
      "Act as a local travel planner. Suggest a two-day trip under ₹5,000, include travel time and free activities, and organize it by day.",
      "Tell me about tourism.",
      "Find the most luxurious places."
    ],
    "answer": 1
  },
  {
    "id": "R5-04",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "A weak prompt says: 'Make my presentation better.' What is the most useful improvement?",
    "options": [
      "Make it amazing.",
      "Specify the audience, purpose, slide limit, tone, and the kind of feedback wanted.",
      "Add more words.",
      "Ask for a professional result."
    ],
    "answer": 1
  },
  {
    "id": "R5-05",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "Which prompt best requests a balanced product comparison?",
    "options": [
      "Tell me which phone is best.",
      "Act as a neutral tech reviewer. Compare these phones on price, battery, camera, software support, and repairability in a table; note missing data and avoid assuming my priorities.",
      "Praise the newest phone.",
      "Give me a short answer with no details."
    ],
    "answer": 1
  },
  {
    "id": "R5-06",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "You want AI help debugging code. Which prompt is most complete?",
    "options": [
      "Fix this.",
      "Act as a debugging tutor. Explain the likely cause, show the smallest safe fix, preserve existing behavior, and ask for missing error details rather than guessing.",
      "Rewrite the entire app.",
      "Make it work better."
    ],
    "answer": 1
  },
  {
    "id": "R5-07",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "Which prompt is best for creating a social media calendar?",
    "options": [
      "Give me posts.",
      "Act as a social media planner. Create a 2-week calendar for a small bakery with post ideas, captions, formats, and a realistic posting frequency.",
      "Make a viral campaign.",
      "Write about food."
    ],
    "answer": 1
  },
  {
    "id": "R5-08",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "A prompt asks for medical advice. Which addition is the most responsible?",
    "options": [
      "Sound certain.",
      "Provide general information, avoid diagnosing, flag urgent warning signs, and recommend a qualified clinician for personal advice.",
      "List every possible disease.",
      "Skip any limitations."
    ],
    "answer": 1
  },
  {
    "id": "R5-09",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "Which prompt best helps generate ideas while keeping them feasible?",
    "options": [
      "Give me 100 ideas.",
      "Act as a practical brainstorming partner. Suggest 10 ideas for a school science fair using household materials, with estimated cost and difficulty for each.",
      "Give me unusual ideas.",
      "Make the ideas exciting."
    ],
    "answer": 1
  },
  {
    "id": "R5-10",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "You need a summary of a long document for a decision meeting. Which prompt is strongest?",
    "options": [
      "Summarize this.",
      "Act as an executive analyst. Summarize the decision, key evidence, risks, open questions, and recommended next steps in under 300 words; distinguish facts from assumptions.",
      "Tell me the important parts.",
      "Make it sound official."
    ],
    "answer": 1
  },
  {
    "id": "R5-11",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "Which prompt best requests creative writing with clear boundaries?",
    "options": [
      "Write a story.",
      "Write a mystery story for ages 10–12, under 800 words, set in a library, with three clues and a fair solution; avoid graphic violence.",
      "Make it thrilling.",
      "Write like a famous living author."
    ],
    "answer": 1
  },
  {
    "id": "R5-12",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "An AI answer contains a statistic with no source. What is the best follow-up?",
    "options": [
      "Assume it is true.",
      "Ask for a reliable source and date, request verification, and allow the answer to say the statistic cannot be confirmed.",
      "Ask it to sound more confident.",
      "Repeat the statistic in the report."
    ],
    "answer": 1
  },
  {
    "id": "R5-13",
    "round": 5,
    "category": "Mixed",
    "difficulty": "easy",
    "question": "What is the best first step when a prompt gives an unclear goal?",
    "options": [
      "Guess the goal.",
      "Ask a focused clarifying question or state a reasonable assumption.",
      "Write the longest possible answer.",
      "Ignore the ambiguity."
    ],
    "answer": 1
  },
  {
    "id": "R5-14",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "Which prompt best asks for a decision framework without handing over the decision?",
    "options": [
      "Choose for me.",
      "Help me compare the options against my stated priorities, explain trade-offs and uncertainties, and leave the final choice to me.",
      "Tell me the only correct answer.",
      "Rank everything without reasons."
    ],
    "answer": 1
  },
  {
    "id": "R5-15",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "Which is the best way to ask for a table?",
    "options": [
      "Organize it well.",
      "Present the results in a table with columns for option, cost, benefit, drawback, and key uncertainty.",
      "Make it readable.",
      "Use clear formatting."
    ],
    "answer": 1
  },
  {
    "id": "R5-16",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "A task has several steps and strict limits. What should a strong prompt do?",
    "options": [
      "Mention only the final goal.",
      "State the goal, ordered steps, constraints, output format, and how success will be judged.",
      "Use more adjectives.",
      "Leave the method entirely implicit."
    ],
    "answer": 1
  },
  {
    "id": "R5-17",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "Which prompt best supports learning instead of simply copying an answer?",
    "options": [
      "Give me the answer.",
      "Act as a tutor: ask one guiding question at a time, offer hints before solutions, and check my understanding.",
      "Solve everything instantly.",
      "Use advanced terminology."
    ],
    "answer": 1
  },
  {
    "id": "R5-18",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "Which prompt is most useful when the output must follow a specific format?",
    "options": [
      "Return the information neatly.",
      "Return valid JSON with the keys title, summary, and three_actions; make three_actions an array of strings and include no extra commentary.",
      "Use a structured answer.",
      "Make it easy to parse."
    ],
    "answer": 1
  },
  {
    "id": "R5-19",
    "round": 5,
    "category": "Mixed",
    "difficulty": "medium",
    "question": "Which prompt best requests a practical business idea assessment?",
    "options": [
      "Is this idea good?",
      "Act as a small-business advisor. Assess the target customer, likely costs, key risks, first validation experiment, and evidence still needed.",
      "Tell me it will succeed.",
      "Write a business plan for everything."
    ],
    "answer": 1
  },
  {
    "id": "R5-20",
    "round": 5,
    "category": "Mixed",
    "difficulty": "hard",
    "question": "What should you do if a prompt's requirements conflict—for example, 'explain every detail in 20 words'?",
    "options": [
      "Ignore one requirement silently.",
      "Ask which requirement matters more, or explain the trade-off and offer a concise alternative.",
      "Use exactly 20 words regardless of usefulness.",
      "Produce a very long answer."
    ],
    "answer": 1
  }
];
function buildGameQuestions(){
  // Keep the original 5-round match length, but randomly choose from the larger bank.
  return [1,2,3,4,5].map(roundNo=>{
    const pool=QUESTION_BANK.filter(q=>q.round===roundNo);
    const q=pool[Math.floor(Math.random()*pool.length)];
    const labels={1:'1. ROLE',2:'2. REQUIREMENTS',3:'3. CONSTRAINTS',4:'4. PLAN',5:'⭐ FINAL CHALLENGE'};
    return {
      title:q.category+' · '+q.difficulty.toUpperCase(),
      badge:labels[roundNo],
      prompt:q.question,
      opts:q.options,
      ans:q.answer
    };
  });
}

function code(){let s='';const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';do{s='';for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)]}while(rooms.has(s));return s}
function send(ws,msg){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(msg))}
function broadcast(room,msg){room.players.forEach(p=>send(p.ws,msg))}
function publicState(room){return {type:'state',players:room.players.map((p,i)=>({id:p.id,name:p.name,score:p.score,streak:p.streak,answered:!!p.answered,index:i})),round:room.round,total:room.questions.length,question:room.questions[room.round]&&{title:room.questions[room.round].title,badge:room.questions[room.round].badge,prompt:room.questions[room.round].prompt,opts:room.questions[room.round].opts},status:room.status}}
function maybeAdvance(room){if(room.players.length===2 && room.players.every(p=>p.answered)){setTimeout(()=>advance(room),900)}}
function advance(room){if(!rooms.has(room.code))return;if(room.round+1>=room.questions.length){room.status='finished';broadcast(room,{type:'finished',players:room.players.map(p=>({name:p.name,score:p.score,streak:p.streak}))});return}room.round++;room.players.forEach(p=>p.answered=false);room.status='playing';broadcast(room,publicState(room))}
function cleanup(room){if(room.timer)clearTimeout(room.timer);rooms.delete(room.code)}
const server=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,rooms:rooms.size}))}if(p==='/')p='/index.html';const file=path.join(__dirname,'public',p);fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end('Not found')}const ext=path.extname(file);const ct=ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.css'?'text/css':'application/octet-stream';res.writeHead(200,{'content-type':ct});res.end(data)})});
const wss=new WebSocket.Server({server});
wss.on('connection',ws=>{let player=null;ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}if(m.type==='create'){const room={code:code(),players:[],questions:buildGameQuestions(),round:0,status:'waiting'};player={id:Math.random().toString(36).slice(2),name:String(m.name||'Player 1').slice(0,20),score:0,streak:0,answered:false,ws};room.players.push(player);rooms.set(room.code,room);send(ws,{type:'created',code:room.code,playerId:player.id});send(ws,publicState(room));return}if(m.type==='join'){const room=rooms.get(String(m.code||'').toUpperCase());if(!room)return send(ws,{type:'error',message:'Room not found.'});if(room.players.length>=2)return send(ws,{type:'error',message:'Room is full.'});player={id:Math.random().toString(36).slice(2),name:String(m.name||'Player 2').slice(0,20),score:0,streak:0,answered:false,ws};room.players.push(player);room.status='playing';room.players.forEach(p=>p.answered=false);broadcast(room,publicState(room));return}if(!player)return;if(m.type==='answer'){const room=[...rooms.values()].find(r=>r.players.includes(player));if(!room||room.status!=='playing'||player.answered)return;const q=room.questions[room.round];player.answered=true;const n=Number(m.answer);let correct=n===q.ans;if(correct){const pts=100+player.streak*25;player.score+=pts;player.streak++;send(ws,{type:'answerResult',correct,points:pts,answer:q.ans})}else{player.streak=0;send(ws,{type:'answerResult',correct,points:0,answer:q.ans})}broadcast(room,publicState(room));maybeAdvance(room)}});ws.on('close',()=>{if(!player)return;const room=[...rooms.values()].find(r=>r.players.includes(player));if(room){room.players=room.players.filter(p=>p!==player);if(room.players.length===0)cleanup(room);else{room.status='waiting';room.round=0;room.players[0].answered=false;send(room.players[0].ws,{type:'opponentLeft'});send(room.players[0].ws,publicState(room))}}})});
server.listen(PORT,'0.0.0.0',()=>console.log(`Prompt Master listening on ${PORT}`));
