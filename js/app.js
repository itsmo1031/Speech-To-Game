'use strict';

const keyframes = `
@keyframes drop {
  100%{
    transform: translateY(100vh) 
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
let dropping;
let dropWordTimeout;
let dropDelay;

const dummy = [
  'aliqua',
  'ex',
  'ad',
  'eiusmod',
  'anim',
  'proident',
  'voluptate',
  'nisi',
  'tempor',
  'ut',
  'incididunt',
  'pariatur',
  'do',
  'in',
  'sit',
  'fugiat',
  'minim',
  'laboris',
  'quis',
  'ea',
  'labore',
  'deserunt',
  'ex',
  'quis',
  'dolor',
  'mollit',
  'est',
  'cillum',
  'labore',
  'irure',
  'est',
  'est',
  'tempor',
  'dolor',
  'deserunt',
  'tempor',
  'esse',
  'dolor',
  'dolor',
  'exercitation',
  'incididunt',
  'sunt',
  'dolor',
  'esse',
  'ullamco',
  'deserunt',
  'commodo',
  'sint',
  'sint',
  'elit',
  'velit',
  'est',
  'est',
  'velit',
  'fugiat',
  'pariatur',
  'sit',
  'in',
  'esse',
  'amet',
  'non',
  'mollit',
  'consectetur',
  'amet',
  'dolor',
  'eiusmod',
  'exercitation',
  'ea',
  'mollit',
  'exercitation',
  'amet',
  'deserunt',
  'excepteur',
  'nulla',
  'dolore',
  'sunt',
  'culpa',
  'cillum',
  'velit',
  'laborum',
  'est',
  'mollit',
  'deserunt',
  'qui',
  'incididunt',
  'tempor',
  'ea',
  'ipsum',
  'amet',
  'mollit',
  'duis',
  'ad',
  'amet',
  'occaecat',
  'ut',
  'occaecat',
  'laboris',
  'elit',
  'laboris',
  'elit',
];

const startGame = () => {
  const delay = Math.round(Math.random() * 5 * 1000);
  dropWordTimeout = setTimeout(drop, delay);
  dropDelay += delay;
};

const drop = () => {
  if (!dummy.length) {
    console.log('data empty');
    clearTimeout(dropWordTimeout);
    clearInterval(dropping);
    return;
  }
  const idx = Math.floor(Math.random() * dummy.length);
  //console.log(idx);
  const word = new Word(dummy.splice(idx, 1));
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
  gameScreen.appendChild(dropWord);

  const wordWidth = dropWord.offsetWidth; // 텍스트의 실제 너비 가져오기
  if (word.posX + wordWidth > document.documentElement.clientWidth) {
    console.log('over width');
    word.posX = document.documentElement.clientWidth - wordWidth;
  }
  dropWord.style.left = `${word.posX}px`;

  //console.log(word.posX);
};

const init = () => {
  console.log('Initiated!');
  dropping = setInterval(startGame, 1000);
};

window.onload = init;
