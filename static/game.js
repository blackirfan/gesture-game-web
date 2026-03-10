const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const fighterImg = new Image();
fighterImg.src = "/static/fighter.png";

const enemyImg = new Image();
enemyImg.src = "/static/enemy.png";

let playerName = "";
let gameRunning = false;

let playerX = 350;

let bullets = [];
let enemies = [];

let score = 0;
let level = 1;
let lives = 3;

let enemySpeed = 2;

// ---------- Start Game ----------
function startGame(){

playerName = document.getElementById("playerName").value;

if(playerName==""){

alert("Enter name first");
return;

}

document.getElementById("startScreen").style.display="none";

gameRunning=true;

}

// ---------- Enemy spawn ----------
function spawnEnemy(){

if(!gameRunning) return;

enemies.push({

x:Math.random()*760,
y:-40,
width:40,
height:40

});

}

// ---------- Shoot ----------
function shoot(){

bullets.push({

x:playerX+25,
y:520,
width:5,
height:10

});

}

// ---------- Update ----------
function updateGame(){

if(!gameRunning) return;

bullets.forEach(b=>b.y-=8);

enemies.forEach(e=>e.y+=enemySpeed);


// collision
enemies.forEach((enemy,ei)=>{

bullets.forEach((bullet,bi)=>{

if(

bullet.x < enemy.x+enemy.width &&
bullet.x+bullet.width > enemy.x &&
bullet.y < enemy.y+enemy.height &&
bullet.y+bullet.height > enemy.y

){

enemies.splice(ei,1);
bullets.splice(bi,1);

score+=10;

if(score%100===0){

level++;
enemySpeed+=1;

}

}

});

});


// enemy hits player
enemies.forEach((enemy,ei)=>{

if(enemy.y>520){

lives--;
enemies.splice(ei,1);

if(lives<=0){

endGame();

}

}

});

}


// ---------- Draw ----------
function drawGame(){

ctx.clearRect(0,0,800,600);

ctx.drawImage(fighterImg,playerX,520,60,60);

bullets.forEach(b=>{

ctx.fillStyle="yellow";
ctx.fillRect(b.x,b.y,5,10);

});

enemies.forEach(e=>{

ctx.drawImage(enemyImg,e.x,e.y,50,50);

});

ctx.fillStyle="white";
ctx.font="20px Arial";

ctx.fillText("Score: "+score,20,30);
ctx.fillText("Lives: "+lives,20,60);
ctx.fillText("Level: "+level,20,90);

}


// ---------- Gesture ----------
async function getGesture(){

if(!gameRunning) return;

const res = await fetch("/gesture");
const data = await res.json();

playerX = data.x * 750;

if(data.fingers>=4){

shoot();

}

}


// ---------- End Game ----------
async function endGame(){

gameRunning=false;

const res = await fetch("/submit_score",{

method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({

name:playerName,
score:score

})

});

const leaderboard = await res.json();

displayLeaderboard(leaderboard);

}


// ---------- Show leaderboard ----------
function displayLeaderboard(scores){

let html="<h2>Top Scores</h2>";

scores.forEach(s=>{

html += `<p>${s.name} - ${s.score}</p>`;

});

document.getElementById("leaderboard").innerHTML=html;

}


// ---------- Main loop ----------
function gameLoop(){

updateGame();
drawGame();

requestAnimationFrame(gameLoop);

}

setInterval(spawnEnemy,2000);
setInterval(getGesture,80);

gameLoop();