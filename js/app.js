'use strict';

window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'ko-KR';
recognition.maxAlternatives = 10000;

const settings = {
  SCORE_PER_LETTER: 50,
};

const keyframes = `
@keyframes drop {
  100%{
    transform: translateY(${
      document.getElementById('main-section').offsetHeight
    }px) 
  }
}
`;

const style = document.createElement('style');
style.innerHTML = keyframes;
const head = document.head || document.getElementsByTagName('head')[0];
head.appendChild(style);

class Word {
  constructor(args) {
    this.value = args[0];
    this.posX =
      args[1] ||
      Math.floor(
        Math.random() * document.getElementById('game-section').offsetWidth
      );
    this.posY = args[2] || 0;
  }
}

const gameScreen = document.getElementById('game-section');
const titleScreen = document.getElementById('title-section');
const retryScreen = document.getElementById('retry-section');
const timeouts = [];
let bestScore = localStorage.getItem('bestScore');
let score = 0;
const scoreField = document.getElementById('score');
const bestScoreField = document.getElementById('best-score');
const finalScore = document.getElementById('final-score');
let dropping;
let dropWordTimeout;
let dropDelay;
// 음성 인식 결과를 저장할 배열
const speechWords = [];
let muted = localStorage.getItem('muted')
  ? JSON.parse(localStorage.getItem('muted'))
  : true;
const volumeBtn = document.getElementById('volume');
const bgm = new Audio('static/game-bgm.mp3');
const startMusic = new Audio('static/game-start.mp3');
const endMusic = new Audio('static/game-end.mp3');
const selectSound = new Audio('static/select.mp3');
const inputSound = new Audio('static/input.mp3');
const audios = [bgm, startMusic, endMusic, selectSound, inputSound];

// result 이벤트 핸들러 설정
recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  const words = transcript.split(' ').filter((i) => i.length != 0);

  speechWords.push(...words);
  console.log(speechWords);
};

const addTimeout = (callback, delay) => {
  const timeoutId = setTimeout(() => {
    callback();
    // 타임아웃이 실행된 후 배열에서 제거
    timeouts.splice(timeouts.indexOf(timeoutId), 1);
  }, delay);
  // 타임아웃 식별자를 배열에 저장
  timeouts.push(timeoutId);
};

const handleDropWords = () => {
  const delay = Math.round(Math.random() * 5 * 1000);
  dropWordTimeout = addTimeout(drop, delay);
  dropDelay += delay;
};

const drop = () => {
  if (!speechWords.length) {
    console.log('Speech words empty!');
    return;
  }
  const word = new Word(speechWords.splice(0, 1));
  const dropWord = document.createElement('div');
  dropWord.classList.add('word');
  dropWord.style.animationDelay = `${dropDelay}s`;
  if (word.posX + dropWord.offsetWidth > document.documentElement.clientWidth) {
    console.log('over width');
    word.posX = document.documentElement.clientWidth - dropWord.offsetWidth;
  }
  dropWord.style.whiteSpace = 'nowrap';
  dropWord.style.animationTimingFunction = 'linear';
  dropWord.innerText = word.value;
  // 단어 애니메이션 종료 시 호출되는 핸들러 추가
  dropWord.addEventListener('animationend', handleAnimationEnd);

  gameScreen.appendChild(dropWord);

  const wordWidth = dropWord.offsetWidth; // 텍스트의 실제 너비 가져오기
  if (word.posX + wordWidth > document.documentElement.clientWidth) {
    console.log('over width');
    word.posX = document.documentElement.clientWidth - wordWidth;
  }
  dropWord.style.left = `${word.posX}px`;
};

const handleInput = (event) => {
  if (event.key === ' ' || event.key === 'Enter') {
    const inputValue = event.target.value;

    const wordElements = document.getElementsByClassName('word');
    for (let i = 0; i < wordElements.length; i++) {
      const wordElement = wordElements[i];
      if (wordElement.innerText === inputValue.replace(' ', '')) {
        inputSound.play();
        score += wordElement.innerText.length * settings.SCORE_PER_LETTER;
        displayScore(score);
        wordElement.parentNode.removeChild(wordElement);
        break; // 가장 먼저 생성된 하나만 삭제 후 반복문 종료
      }
    }

    event.target.value = ''; // 입력 필드 비우기
  }
};

// 모든 타임아웃 클리어
const clearAllTimeouts = () => {
  timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  timeouts.length = 0;
};

const handleAnimationEnd = () => {
  const wordElements = Array.from(document.getElementsByClassName('word'));
  wordElements.forEach((element) => {
    element.parentNode.removeChild(element);
  });
  if (document.getElementsByClassName('word').length === 0) {
    clearAllTimeouts();
    clearInterval(dropping);
    gameOver();
  }
};

const gameOver = () => {
  const inputDiv = document.getElementById('input-div');
  console.log('Game Over');
  document.getElementById('rec').classList.toggle('display-none');
  stopRecognition();
  toggleScreen('game-section', 'retry-section');
  toggleScreen('header-game-left', 'header-retry-left');
  window.addEventListener('keydown', handleRadio);
  window.addEventListener('keyup', handleSelection);
  endMusic.play();
  bgm.pause();
  bgm.currentTime = 0;
  finalScore.innerText = score.toString().padStart(6, '0');
  // 현재 점수 최종 점수와 비교
  if (isBestScore()) {
    bestScore = score;
    console.log('new record!');
    localStorage.setItem('bestScore', score);
    finalScore.parentNode.classList.add('best');
  }
  inputDiv.classList.toggle('display-none');
  inputDiv.classList.toggle('input-animation');
};

const isBestScore = () => {
  return !bestScore || score > parseInt(bestScore);
};

const displayScore = (num) => {
  const padNum = num.toString().padStart(6, '0');
  scoreField.innerText = padNum;
  if (num > bestScore) {
    bestScoreField.innerText = padNum;
  }
};

const displayBestScore = () => {
  if (bestScore) {
    bestScoreField.innerText = bestScore.toString().padStart(6, '0');
  }
};

const clearScore = () => {
  score = 0;
  scoreField.innerText = '000000';
};

const handleGameStart = (event) => {
  if (event.key === 'Enter') {
    toggleScreen('title-section', 'game-section');
    toggleScreen('header-main-left', 'header-game-left');
    gameStart();
    window.removeEventListener('keyup', handleGameStart);
  }
};

const startRecognition = () => {
  recognition.start();
  recognition.addEventListener('end', recognition.start);
};

const stopRecognition = () => {
  recognition.removeEventListener('end', recognition.start);
  recognition.stop();
};

const gameStart = () => {
  const inputDiv = document.getElementById('input-div');
  inputDiv.classList.toggle('display-none');
  inputDiv.classList.toggle('input-animation');
  const inputField = document.getElementById('input-field');
  document.getElementById('input-div').addEventListener('animationend', () => {
    inputField.focus();
    document.getElementById('rec').classList.toggle('display-none');
    dropping = setInterval(handleDropWords, 1000);
  });
  inputField.addEventListener('keyup', handleInput);
  displayBestScore();
  clearScore();
  startRecognition();
  startMusic.play().then(() => {
    setTimeout(() => {
      bgm.loop = true;
      bgm.play();
    }, 2500);
  });
};

const toggleScreen = (fromScreen, toScreen) => {
  const fs = document.getElementById(fromScreen);
  const ts = document.getElementById(toScreen);
  fs.classList.toggle('display-none');
  ts.classList.toggle('display-none');
};

const playSelectSound = () => {
  selectSound.pause();
  selectSound.currentTime = 0;
  selectSound.play();
};

const handleRadio = (event) => {
  const radios = Array.from(document.getElementsByClassName('retry-selection'));
  const currentIndex = radios.findIndex((r) => r.checked);
  let nextIndex;
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : radios.length - 1;
    playSelectSound();
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    nextIndex = currentIndex < radios.length - 1 ? currentIndex + 1 : 0;
    playSelectSound();
  }
  if (nextIndex !== undefined) {
    radios[currentIndex].checked = false;
    radios[nextIndex].checked = true;
  }
};

const handleRadioHover = (event) => {
  const target = event.target.firstElementChild;
  playSelectSound();
  if (!target.checked) {
    const other = document.querySelector(
      'input[name="selection-radio"]:checked'
    );
    other.checked = false;
    target.checked = true;
  }
};

const handleSelection = (event) => {
  console.log('call!');
  if (
    event.key === ' ' ||
    event.key === 'Enter' ||
    event instanceof MouseEvent
  ) {
    const radioResult = document.querySelector(
      'input[name="selection-radio"]:checked'
    ).value;
    if (radioResult === 'retry') {
      toggleScreen('retry-section', 'game-section');
      toggleScreen('header-retry-left', 'header-game-left');
      gameStart();
    } else {
      toggleScreen('retry-section', 'title-section');
      toggleScreen('header-retry-left', 'header-main-left');
      startMusic.play();
      window.addEventListener('keyup', handleGameStart);
    }

    finalScore.parentNode.classList.remove('best');
    window.removeEventListener('keydown', handleRadio);
    window.removeEventListener('keyup', handleSelection);
  }
};

const handleRadioClick = (event) => {
  event.preventDefault();
  handleSelection(event);
};

const preventHandler = (event) => {
  if (event.defaultPrevented) return;
};

const handleClickVolume = (event) => {
  toggleVolumeIcon();
  muted = !muted;
  localStorage.setItem('muted', muted);
  console.log('muted: ' + muted);
  toggleAllAudios(muted);
};

const toggleAllAudios = (isMuted) => {
  audios.forEach((audio) => {
    audio.muted = isMuted;
  });
};

const toggleVolumeIcon = () => {
  volumeBtn.classList.toggle('fa-volume-high');
  volumeBtn.classList.toggle('fa-volume-xmark');
};

const init = () => {
  console.log('Initiated!');
  if (!muted) {
    console.log('music not muted. toggle volume icon');
    toggleVolumeIcon(volumeBtn);
  } else {
    toggleAllAudios(true);
  }
  volumeBtn.addEventListener('click', handleClickVolume);
  window.addEventListener('keyup', handleGameStart);
  document.querySelectorAll('#selection label').forEach((e) => {
    e.addEventListener('mouseenter', handleRadioHover);
    e.addEventListener('click', handleRadioClick);
    e.childNodes.forEach((n) => {
      n.addEventListener('click', preventHandler);
    });
  });
};

window.onload = init;
