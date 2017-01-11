'use strict'

const Rx = require('rxjs');
const _ = require('lodash');

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

  doubleClickStream.subscribe(event => label.text('button is double clicked!!'));

  doubleClickStream.delay(1000).subscribe(suggestion => label.text('-'));

  const startupRequestStream = Rx.Observable.of('https://api.github.com/users');


  //
  const refreshButton = $('.refresh');

  const refreshStream = Rx.Observable.fromEvent(refreshButton, 'click');

  const requestOnRefreshStream = refreshStream.map(event => {
    const random = Math.floor(Math.random() * 500);
    return `https://api.github.com/users?since=${random}`;
  });
  const responseStream = requestOnRefreshStream.merge(startupRequestStream)
    .flatMap(url => Rx.Observable.fromPromise($.getJSON(url)));

  responseStream.subscribe(res => {
    console.log(res);
  })

  const suggestionStream1 = createSuggestionStream(responseStream);
  const suggestionStream2 = createSuggestionStream(responseStream);
  const suggestionStream3 = createSuggestionStream(responseStream);


  suggestionStream1.subscribe(_.curry(renderSuggestion)('.suggestion1'));
  suggestionStream2.subscribe(_.curry(renderSuggestion)('.suggestion2'));
  suggestionStream3.subscribe(_.curry(renderSuggestion)('.suggestion3'));
});

const createSuggestionStream = responseStream => responseStream.map(listUser => listUser[Math.floor(Math.random() * listUser.length)]);

const renderSuggestion = (selector, userData) => {
  let userElem = $('.username', selector);
  console.log('userElem', userElem);
  userElem.attr('href', userData.html_url);
  userElem.text(userData.login);
  const imgElem = $('img', selector);
  imgElem.attr('src', userData.avatar_url);
}

