const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const WAIT_MS=30000;
let state={
  name:"",
  balance:0,
  completed:new Set(JSON.parse(localStorage.getItem("completedTasks")||"[]")),
  history:JSON.parse(localStorage.getItem("withdrawals")||"[]"),
  started:JSON.parse(localStorage.getItem("taskTimers")||"{}")
};
const taskNames={facebook:"Facebook",tiktok:"TikTok",groups:"WhatsApp groups",friends:"WhatsApp friends"};
function save(){
  localStorage.setItem("completedTasks",JSON.stringify([...state.completed]));
  localStorage.setItem("withdrawals",JSON.stringify(state.history));
  localStorage.setItem("taskTimers",JSON.stringify(state.started));
}
function toast(msg){
  const t=$("#toast");t.textContent=msg;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2500);
}
function money(n){
  return new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n);
}
function formatTime(ms){
  const total=Math.max(0,Math.ceil(ms/1000)),m=Math.floor(total/60),s=total%60;
  return `${m}:${String(s).padStart(2,"0")}`;
}
function render(){
  $("#balance").textContent=money(state.balance);
  $("#walletBalance").textContent=money(state.balance);
  $("#completedCount").textContent=`${state.completed.size} task${state.completed.size===1?"":"s"} completed`;
  const pct=Math.min(100,state.balance/3000*100);
  $("#progressBar").style.width=pct+"%";
  $("#progressText").textContent=`${money(state.balance)} / ₦3,000`;

  ["facebook","tiktok","groups","friends"].forEach(k=>{
    const b=document.querySelector(`[data-task="${k}"]`);
    const countdown=document.querySelector(`[data-countdown="${k}"]`);
    if(!b)return;
    if(state.completed.has(k)){
      b.textContent="✓ Completed";b.classList.add("completed");b.disabled=true;
      if(countdown){countdown.textContent="Task completed";countdown.classList.add("show");}
      return;
    }
    const started=state.started[k];
    if(started){
      const remaining=WAIT_MS-(Date.now()-started);
      if(remaining<=0){
        b.classList.remove("waiting");b.classList.add("ready");b.disabled=false;
        if(countdown){countdown.textContent="You can now confirm completion.";countdown.classList.add("show");}
      }else{
        b.classList.remove("ready");b.classList.add("waiting");b.disabled=true;
        if(countdown){countdown.textContent=`Confirmation available in ${formatTime(remaining)}`;countdown.classList.add("show");}
      }
    }else{
      b.classList.remove("ready","waiting");b.disabled=true;
      if(countdown){countdown.textContent="Open the task first to start the 30-second timer.";countdown.classList.remove("show");}
    }
  });

  const unlocked=state.completed.has("facebook")&&state.completed.has("tiktok");
  $("#finalLocked").classList.toggle("hidden",unlocked);
  $("#finalTasks").classList.toggle("hidden",!unlocked);
  $("#withdrawBtn").disabled=state.balance<3000;
  $("#withdrawBtn").textContent=state.balance>=3000?"Withdraw now":"Withdrawal locked 🔒";
}
function startTask(k){
  if(state.completed.has(k))return;
  if(!state.started[k]){
    state.started[k]=Date.now();
    save();render();
    toast(`30-second task timer started for ${taskNames[k]}.`);
  }
}
function showScreen(id){
  $$(".screen").forEach(x=>x.classList.remove("active"));
  $("#"+id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
  $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));
}
$("#continueBtn").onclick=()=>{
  const name=$("#fullName").value.trim(),bank=$("#bankName").value,acct=$("#accountNumber").value.trim();
  if(!name||!bank||!/^\d{10}$/.test(acct)){
    toast("Please enter a valid name, bank and 10-digit account number.");return;
  }
  state.name=name;
  $("#userFirstName").textContent=name.split(/\s+/)[0];
  localStorage.setItem("userDetails",JSON.stringify({name,bank,acctMasked:"••••"+acct.slice(-4)}));
  $("#detailsScreen").classList.remove("active");$("#tasksScreen").classList.add("active");
  $("#bottomNav").classList.remove("hidden");render();toast("Welcome! Your task dashboard is ready.");
};

$$(".social-link").forEach(link=>{
  link.addEventListener("click",()=>{
    const k=link.closest(".task-card")?.querySelector(".confirm-btn")?.dataset.task;
    if(k)startTask(k);
  });
});

$$("[data-share]").forEach(btn=>{
  btn.onclick=()=>{
    const type=btn.dataset.share;
    const k=type==="groups"?"groups":"friends";
    startTask(k);
    const msg=`🔥 TASK REWARDS IS HERE! 💰

You can now earn ₦600 for every task you successfully complete!

🔥 Minimum withdrawal: ₦3,000
📲 Simple tasks
💰 Earn as you complete
⚡ Get started easily

👇 JOIN TASK REWARDS NOW
🔗 https://task-rewards-puce.vercel.app

Don't just scroll — put your time to work! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank","noopener");
  };
});

$$(".confirm-btn").forEach(btn=>btn.onclick=()=>{
  const k=btn.dataset.task;
  if(state.completed.has(k))return;
  const started=state.started[k];
  if(!started){toast("Open the task first.");return;}
  if(Date.now()-started<WAIT_MS){toast("Please wait until the 30-second timer finishes.");return;}
  state.completed.add(k);state.balance+=600;delete state.started[k];save();render();
  toast(`${taskNames[k]} task completed. +₦600 added.`);
});

$$(".nav-item").forEach(btn=>btn.onclick=()=>showScreen(btn.dataset.screen));
function openThemes(){$("#themeSheet").classList.add("show")}
$("#themeBtn").onclick=openThemes;$("#themeSetting").onclick=openThemes;
$("#closeTheme").onclick=()=>$("#themeSheet").classList.remove("show");
$$("[data-theme]").forEach(b=>b.onclick=()=>{
  document.body.dataset.theme=b.dataset.theme;localStorage.setItem("theme",b.dataset.theme);
  $("#themeSheet").classList.remove("show");
});
$("#withdrawBtn").onclick=()=>{
  if(state.balance<3000)return;
  const amount=state.balance;
  state.history.push({date:new Date().toLocaleDateString("en-NG"),amount,status:"Pending"});
  state.balance=0;save();render();toast(`Withdrawal request for ${money(amount)} submitted.`);
};

const savedTheme=localStorage.getItem("theme");if(savedTheme)document.body.dataset.theme=savedTheme;
const saved=JSON.parse(localStorage.getItem("userDetails")||"null");
if(saved){state.name=saved.name;$("#fullName").value=saved.name;$("#userFirstName").textContent=saved.name.split(/\s+/)[0]}
render();

setInterval(render,1000);
