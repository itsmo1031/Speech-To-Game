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
      Math.floor(Math.random() * document.documentElement.clientWidth);
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
let dropping;
let dropWordTimeout;
let dropDelay;
// 음성 인식 결과를 저장할 배열
const speechWords = [];

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
    console.log('Speech words empty');
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
  console.log('Game Over');
  // 현재 점수 최종 점수와 비교
  if (isBestScore()) {
    bestScore = score;
    console.log('new record!');
    localStorage.setItem('bestScore', score);
  }
};

const isBestScore = () => {
  return !bestScore || score > parseInt(bestScore);
};

const init = () => {
  console.log('Initiated!');
  window.addEventListener('keyup', handleGameStart);
};

const displayScore = (num) => {
  scoreField.innerText = num.toString().padStart(6, '0');
};

const displayBestScore = () => {
  if (bestScore) {
    document.getElementById('best-score').innerText = bestScore
      .toString()
      .padStart(6, '0');
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
    recognition.start();
    dropping = setInterval(handleDropWords, 1000);
    displayBestScore();
    clearScore();
    const inputField = document.getElementById('input-field');
    inputField.addEventListener('keyup', handleInput);
    inputField.focus();
    window.removeEventListener('keyup', handleGameStart);
  }
};

const toggleScreen = (fromScreen, toScreen) => {
  const fs = document.getElementById(fromScreen);
  const ts = document.getElementById(toScreen);
  fs.classList.toggle('display-none');
  ts.classList.toggle('display-none');
};

window.onload = init;
