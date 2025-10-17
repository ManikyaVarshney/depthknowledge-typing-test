/* Typing Test JS */
let paragraphs = {
  easy:["Typing is fun. Try to type quickly.","Keep practicing every day.","Practice improves speed."],
  medium:["Advanced typing requires focus and attention.","Accuracy is more important than speed.","Daily practice makes typing automatic."],
  high:["Consistent effort and concentration leads to mastery.","Typing without looking improves muscle memory.","Challenge yourself with longer texts."],
  pro:["Professional typists can type over 100 words per minute.","Each keystroke builds speed and efficiency.","Complex words test your precision and concentration."],
  master:["Mastering typing is a combination of speed, accuracy, and endurance.","Longer passages help develop rhythm.","Avoid looking at the keyboard for better performance."],
  grandmaster:["Grandmasters maintain perfect accuracy even under pressure.","They use advanced techniques and shortcuts.","Practice daily and track progress for excellence."]
};

let testLevel = "easy";
let timer = 60;
let interval;
let wpm = 0, netWpm=0, accuracy=100;

const typingText = document.getElementById("typing-text");
const typingInput = document.getElementById("typing-input");
const startBtn = document.getElementById("start-test");
const statsEl = document.getElementById("stats");
const certificateContainer = document.getElementById("certificate-container");

function pickParagraph(level){
  let arr = paragraphs[level];
  return arr[Math.floor(Math.random()*arr.length)];
}

function startTest(){
  typingInput.value="";
  let text = pickParagraph(testLevel);
  typingText.innerHTML = text;
  let startTime = Date.now();
  let totalWords = text.trim().split(/\s+/).length;

  interval = setInterval(()=>{
    let elapsed = (Date.now()-startTime)/1000;
    if(elapsed>=timer){
      clearInterval(interval);
      calculateResult();
    }
    statsEl.innerHTML = `Time: ${Math.ceil(timer-elapsed)}s`;
  },1000);

  typingInput.oninput = ()=>{
    let typed = typingInput.value;
    let typedWords = typed.trim().split(/\s+/).length;
    let correct = 0;
    text.split(/\s+/).forEach((w,i)=>{
      if(typed.split(/\s+/)[i]===w) correct++;
    });
    accuracy = Math.floor((correct/totalWords)*100);
    wpm = Math.floor((typedWords/( (Date.now()-startTime)/1000/60)));
    netWpm = Math.floor(wpm * accuracy/100);
    statsEl.innerHTML = `Time Left: ${Math.ceil(timer-(Date.now()-startTime)/1000)}s | WPM: ${wpm} | Net WPM: ${netWpm} | Accuracy: ${accuracy}%`;
  };
}

function calculateResult(){
  statsEl.innerHTML += " | Test Finished!";
  generateCertificate();
}

function generateCertificate(){
  let nameInput = document.getElementById("nameInput") || {value:"Guest"};
  let date = new Date().toLocaleString();
  certificateContainer.innerHTML = `
    <div class="certificate">
      <h2>Typing Test Certificate</h2>
      <p><b>Name:</b> ${nameInput.value}</p>
      <p><b>Date & Time:</b> ${date}</p>
      <p><b>Level:</b> ${testLevel}</p>
      <p><b>Speed:</b> ${wpm} WPM</p>
      <p><b>Net Speed:</b> ${netWpm} WPM</p>
      <p><b>Accuracy:</b> ${accuracy}%</p>
      <p>Issued by Depth Knowledge</p>
    </div>
  `;
}

// Level selector
const levelSelect = document.getElementById("level-select");
if(levelSelect){
  levelSelect.onchange = ()=>{testLevel=levelSelect.value;}
}

startBtn.onclick = startTest;

// DKProfiles integration
(function(){
  function fillProfile(profile){
    const nameInput = document.getElementById("nameInput");
    if(nameInput && profile) nameInput.value = profile.name;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if(id && window.DKProfiles){
    const profile = DKProfiles.getById(id);
    fillProfile(profile);
  }

  const applyBtn = document.getElementById('dk_apply_id');
  if(applyBtn){
    applyBtn.addEventListener('click', function(){
      const idBox = document.getElementById('dk_use_id');
      const id = idBox.value.trim();
      if(!id) return alert("Enter ID like DKT-12345");
      if(window.DKProfiles){
        const profile = DKProfiles.getById(id);
        if(profile) fillProfile(profile);
        else alert("ID not found on this device.");
      }
    });
  }
})();
