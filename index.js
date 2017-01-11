'use strict'

const Rx = require('rxjs');

let source = Rx.Observable.interval(400).take(9)
  .map(i => ['1', '2', '3', 'foo', 'bar', '8', '13'][i]);

const result = source
  .map(x => parseInt(x))
  .filter(x => !isNaN(x))
  .reduce((x, y) => x + y);

result.subscribe(console.log);

$(document).ready(() => {
  const button = $('.button');
  const label = $('.text');
  console.log(`button is ${button.textContent}`);
  console.log(`text is ${label}`);

  let clickStream = Rx.Observable.fromEvent(button, 'click');

  const doubleClickStream = clickStream
    .bufferWhen(() => clickStream.debounceTime(250))
    .map(arr => arr.length)
    .filter(len => len === 2);

  doubleClickStream.subscribe(event => label.text('double clicked!'));

  doubleClickStream.delay(1000).subscribe(suggestion => label.text('-'));
});


