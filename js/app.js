'use strict';

window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'ko-KR';
recognition.maxAlternatives = 10000;

const keyframes = `
@keyframes drop {
  100%{
    transform: translateY(${document.getElementById('game').offsetHeight}px) 
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

const gameScreen = document.getElementById('game');
const timeouts = [];
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

const startGame = () => {
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

  //console.log(word.posX);
};

const handleInput = (event) => {
  if (event.key === ' ' || event.key === 'Enter') {
    const inputValue = event.target.value.replace(' ', '');

    const wordElements = document.getElementsByClassName('word');
    for (let i = 0; i < wordElements.length; i++) {
      const wordElement = wordElements[i];
      if (wordElement.innerText === inputValue) {
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

    alert('Game Over');
  }
};

const init = () => {
  console.log('Initiated!');
  recognition.start();
  dropping = setInterval(startGame, 1000);

  const inputField = document.getElementById('input-field');
  inputField.addEventListener('keydown', handleInput);
};

window.onload = init;
