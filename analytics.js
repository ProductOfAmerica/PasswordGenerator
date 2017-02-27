// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var _AnalyticsCode = 'UA-92568364-1';

var _gaq = [];
_gaq.push(['_setAccount', _AnalyticsCode]);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();

function trackButtonClick(e) {
  _gaq.push(['_trackEvent', e.target.id, 'clicked']);
}

document.addEventListener('DOMContentLoaded', function () {
  var buttons = document.querySelectorAll('a');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', trackButtonClick);
  }
});