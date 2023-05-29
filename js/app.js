'use strict';

window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'ko-KR';
recognition.maxAlternatives = 10000;

const settings = {
  SCORE_PER_LETTER: 50,
  WORD_CREATE_DELAY: 2.5,
};

const style = document.getElementById('keyframe');
const gameScreen = document.getElementById('game-section');
const timeouts = []; // timeout이 설정된 단어들을 저장할 배열(게임 종료시 전부 삭제하도록)
let bestScore = localStorage.getItem('bestScore')
  ? parseInt(localStorage.getItem('bestScore'))
  : 0;
let score = 0;
const scoreField = document.getElementById('score');
const bestScoreField = document.getElementById('best-score');
const finalScore = document.getElementById('final-score');
const inputDiv = document.getElementById('input-div');
const inputField = document.getElementById('input-field');
let isGameOver = false;
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

class Word {
  constructor(args) {
    this.value = args.name;
    this.posX = args.posX || Math.floor(Math.random() * 100);
    this.posY = args.posY || 0;
  }
}

// result 이벤트 핸들러 설정
recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  const words = transcript.split(' ').filter((i) => i.length != 0);

  let delay = 500;

  words.forEach((word) => {
    console.log(`Next drop word: ${word}, delay: ${delay}`);
    if (isGameOver) {
      return console.log('Game Already Over! skip...');
    }
    addTimeout(drop, word, delay);
    delay += Math.round(
      Math.random() * settings.WORD_CREATE_DELAY * 1000 + 500
    );
  });
};

const addTimeout = (callback, word, delay) => {
  const timeoutId = setTimeout(() => {
    callback(word);
    // 타임아웃이 실행된 후 배열에서 제거
    timeouts.splice(timeouts.indexOf(timeoutId), 1);
  }, delay);
  // 타임아웃 식별자를 배열에 저장
  timeouts.push(timeoutId);
};

const drop = (elem) => {
  const word = new Word({ name: elem });
  console.log(word);
  const dropWord = document.createElement('div');
  dropWord.classList.add('word');
  dropWord.style.whiteSpace = 'nowrap';
  dropWord.style.animationTimingFunction = 'linear';
  dropWord.innerText = word.value;
  // 단어 애니메이션 종료 시 호출되는 핸들러 추가
  dropWord.addEventListener('animationend', handleAnimationEnd);

  gameScreen.appendChild(dropWord);

  const wordWidthPercent = Math.ceil(getElementPercent(dropWord.offsetWidth)); // 텍스트의 실제 너비 가져오기
  // 현재 게임 사이즈 + 왼쪽 패딩 5%
  const sectionWidthPercent =
    Math.ceil(getElementPercent(gameScreen.offsetWidth)) + 5;
  if (sectionWidthPercent + wordWidthPercent > 90) {
    console.log('over width! adjust posX value');
    word.posX -= wordWidthPercent;
  }
  dropWord.style.left = `${word.posX}%`;
};

const getElementPercent = (size) => {
  return (size / window.innerWidth) * 100;
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
  clearAllTimeouts();
  wordElements.forEach((element) => {
    element.parentNode.removeChild(element);
  });
  if (document.getElementsByClassName('word').length === 0 && !isGameOver) {
    isGameOver = true;
    gameOver();
  }
};

const isBestScore = () => {
  return score > bestScore;
};

const displayScore = (num) => {
  const padNum = num.toString().padStart(6, '0');
  scoreField.innerText = padNum;
  if (num > bestScore) {
    bestScoreField.innerText = padNum;
  }
};

const displayBestScore = () => {
  bestScoreField.innerText = bestScore.toString().padStart(6, '0');
};

const clearScore = () => {
  score = 0;
  scoreField.innerText = '000000';
};

const handleGameStart = (event) => {
  if (event.key === 'Enter') {
    startMusic.play();
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
  isGameOver = false;
  switchToGame();
  inputField.addEventListener('keyup', handleInput);
  displayBestScore();
  clearScore();
  startRecognition();

  setTimeout(() => {
    bgm.loop = true;
    bgm.play();
  }, 2500);
};

const gameOver = () => {
  isGameOver = true;
  inputField.removeEventListener('keyup', handleInput);
  console.log('Game Over');
  document.getElementById('rec').classList.add('display-none');
  stopRecognition();
  switchToRetry();
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
};

// input field의 애니메이션이 끝난 후 동작 (init시 1회 선언)
const setupInputField = () => {
  inputDiv.addEventListener('animationend', () => {
    inputField.value = '';
    inputField.focus();
    document.getElementById('rec').classList.remove('display-none');
  });
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
  if (
    event.key === ' ' ||
    event.key === 'Enter' ||
    event instanceof MouseEvent
  ) {
    const radioResult = document.querySelector(
      'input[name="selection-radio"]:checked'
    ).value;
    startMusic.play();
    if (radioResult === 'retry') {
      gameStart();
    } else {
      switchToMain();
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

const handleClickVolume = () => {
  toggleVolumeIcon();
  muted = !muted;
  localStorage.setItem('muted', muted);
  console.log('muted: ' + muted);
  muteAudio(muted);
};

const muteAudio = (isMuted) => {
  audios.forEach((audio) => {
    audio.muted = isMuted;
  });
};

const toggleVolumeIcon = () => {
  volumeBtn.classList.toggle('fa-volume-high');
  volumeBtn.classList.toggle('fa-volume-xmark');
};

const hideAllScreen = () => {
  // 헤더, 메인, 입력창의 모든 요소들 선언
  const headerSection = Array.from(
    document.getElementById('header-left').children
  );
  const mainSection = Array.from(
    document.getElementById('main-section').children
  );
  const inputSection = Array.from(
    document.getElementById('input-section').children
  );
  // forEach문 실행을 위해 한 변수에 합침
  const screens = headerSection.concat(mainSection.concat(inputSection));
  const rec = document.getElementById('rec');
  inputDiv.classList.remove('input-animation');
  rec.classList.add('display-none');
  screens.forEach((s) => {
    s.classList.add('display-none');
  });
};

const switchToMain = () => {
  console.log('switching to main screen...');
  hideAllScreen();
  const mainHeader = document.getElementById('header-main-left');
  const titleScreen = document.getElementById('title-section');

  mainHeader.classList.remove('display-none');
  titleScreen.classList.remove('display-none');
};

const switchToGame = () => {
  console.log('switching to game screen...');
  hideAllScreen();
  const gameHeader = document.getElementById('header-game-left');

  gameHeader.classList.remove('display-none');
  gameScreen.classList.remove('display-none');
  inputDiv.classList.remove('display-none');
  inputDiv.classList.add('input-animation');
};

const switchToRetry = () => {
  console.log('switching to retry screen...');
  hideAllScreen();
  const retryHeader = document.getElementById('header-retry-left');
  const retryScreen = document.getElementById('retry-section');

  retryHeader.classList.remove('display-none');
  retryScreen.classList.remove('display-none');
};

const setupRadioEffect = () => {
  document.querySelectorAll('#selection label').forEach((e) => {
    e.addEventListener('mouseenter', handleRadioHover);
    e.addEventListener('click', handleRadioClick);
    e.childNodes.forEach((n) => {
      n.addEventListener('click', preventHandler);
    });
  });
};

const adjustDropHeight = () => {
  console.log('window resized! adjust drop height...');
  const keyframes = `
  @keyframes drop {
    100%{
      transform: translateY(${
        document.getElementById('main-section').offsetHeight
      }px) 
    }
  }
  `;
  style.innerHTML = keyframes;
};

const init = () => {
  if (!muted) {
    console.log('music not muted. toggle volume icon');
    toggleVolumeIcon();
  } else {
    muteAudio(true);
  }
  adjustDropHeight();
  window.addEventListener('resize', adjustDropHeight);
  window.addEventListener('keyup', handleGameStart);
  volumeBtn.addEventListener('click', handleClickVolume);
  setupInputField();
  setupRadioEffect();
};

window.onload = init;
