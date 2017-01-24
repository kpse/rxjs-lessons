'use strict';

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
    .flatMap(url => {
      console.log('do network request');
      return Rx.Observable.fromPromise($.getJSON(url))
    }).publishReplay(1).refCount();

  responseStream.subscribe(res => {
    console.log(res);
  });

  const close1 = $('.close1');
  const close2 = $('.close2');
  const close3 = $('.close3');

  const close1ClickStream = Rx.Observable.fromEvent(close1, 'click');
  const close2ClickStream = Rx.Observable.fromEvent(close2, 'click');
  const close3ClickStream = Rx.Observable.fromEvent(close3, 'click');

  const suggestionStream1 = createSuggestionStream(responseStream, refreshStream, close1ClickStream);
  const suggestionStream2 = createSuggestionStream(responseStream, refreshStream, close2ClickStream);
  const suggestionStream3 = createSuggestionStream(responseStream, refreshStream, close3ClickStream);


  suggestionStream1.subscribe(_.curry(renderSuggestion)('.suggestion1'));
  suggestionStream2.subscribe(_.curry(renderSuggestion)('.suggestion2'));
  suggestionStream3.subscribe(_.curry(renderSuggestion)('.suggestion3'));

  const startButton = $('#start');
  const resetButton = $('#reset');
  const halfButton = $('#half');
  const quarterButton = $('#quarter');

  const start = Rx.Observable.fromEvent(startButton, 'click');
  const resetClick = Rx.Observable.fromEvent(resetButton, 'click');
  const half = Rx.Observable.fromEvent(halfButton, 'click');
  const quarter = Rx.Observable.fromEvent(quarterButton, 'click');
  const stop = Rx.Observable.fromEvent($('#stop'), 'click');

  const intervalStop = Rx.Observable.interval(1000).takeUntil(stop);

  const data = {count: 0};
  const inc = (acc) => ({count: acc.count + 1});
  const reset = (acc) => data;

  const incOrReset = Rx.Observable.merge(
    intervalStop.mapTo(inc),
    resetClick.mapTo(reset)
  );
  const starter = Rx.Observable.merge(
    start.mapTo(1000),
    half.mapTo(500),
    quarter.mapTo(250)
  );

  const intervalActions = (time) => {
    return Rx.Observable.merge(
      Rx.Observable.interval(time).takeUntil(stop).mapTo(inc),
    resetClick.mapTo(reset)
  )};

  const startInterval = starter
    .switchMap(intervalActions)
    // .switchMapTo(incOrReset)
    .startWith(data)
    .scan((acc, curr) => curr(acc));
  // startInterval.subscribe((x) => console.log(x));


  const input = $('#input')
  const input$ = Rx.Observable.fromEvent(input, 'input')
    .map(event => event.target.value)
  // input$.subscribe(console.log)

  Rx.Observable.combineLatest(
    startInterval,
    input$,
    (timer, text) => ({count: timer.count, text})
  )
    .filter((data) => data.count == parseInt(data.text))
    .subscribe(console.log)
});

const createSuggestionStream = (responseStream, refreshStream, closeClickStream) => {
  let randomUser = listUser => listUser[Math.floor(Math.random() * listUser.length)];

  return responseStream.map(randomUser)
    .startWith(null)
    .merge(refreshStream.map(event => null))
    .merge(closeClickStream.withLatestFrom(responseStream, (event, listUsers) => randomUser(listUsers)));
};

const renderSuggestion = (selector, userData) => {
  if (userData === null) {
    $(selector).hide();
    return;
  }
  $(selector).show();
  let userElem = $('.username', selector);
  console.log('userElem', userElem);
  userElem.attr('href', userData.html_url);
  userElem.text(userData.login);
  const imgElem = $('img', selector);
  imgElem.attr('src', userData.avatar_url);
};

