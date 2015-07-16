var context = new AudioContext();
var drumMachineApp = angular.module("drumMachineApp", []);
drumMachineApp.controller("RhythmCtrl", function($scope) {

  $scope.context = context;


  // stackoverflow.com/questions/12740329/math-functions-in-angular-bindings
  $scope.Math = Math;

  // Where the playhead is
  $scope.cursor = 0;

  // Beats per minute
  $scope.tempo = 128;

  // Process a change to a pattern
  // TODO: Can ng-model handle this?
  $scope.change = function(sound, index) {
    $scope.rhythm.patterns.some(function(pattern) {
      if (pattern.sound === sound) {
        originalVal = pattern.beats[index];
        if (originalVal > 0) {
          pattern.beats[index] = 1;
        } else {
          pattern.beats[index] = 0;
        }
        return true;
      }
    });
  };

  // Begin the pattern running
  $scope.play = function() {
    // Remember where we started this play (to keep track of where the
    // actual cursor is)
    $scope.startedPlaying = context.currentTime;
    $scope.offsetAtStart = $scope.cursor % 1;
    $scope.lastTick = context.currentTime - ($scope.cursor % 1) * $scope.getTickLength();
    $scope.playing = true;
    $scope.renderPattern().then(function(buffer) {
      var source = $scope.context.createBufferSource();
      source.buffer = buffer;
      source.connect($scope.context.destination);
      source.loop = true;
      source.start($scope.context.currentTime, $scope.cursor * $scope.getTickLength());
      if ($scope.playbackSource) {
        $scope.playbackSource.stop();
      }
      $scope.playbackSource = source;
    });
  };

  $scope.getTickLength = function() {
    return 60 / $scope.tempo / 4;
  };

  $scope._buffers = {};
  getBuffer("snare.wav").then(function(buffer) {
    $scope._buffers["snare"] = buffer;
  });
  getBuffer("kick.wav").then(function(buffer) {
    $scope._buffers["kick"] = buffer;
  });
  getBuffer("hat.wav").then(function(buffer) {
    $scope._buffers["hat"] = buffer;
  });

  $scope.getBuffer = function(name) {
    return $scope._buffers[name];
  };

  $scope.renderPattern = function() {
    return new Promise(function(resolve, reject) {
      var tickLength = $scope.getTickLength();
      if ($scope.tempo <= 0) {
        reject(new Error("Invalid tempo"));
      }
      var context = new OfflineAudioContext(1, 16 * tickLength * 44100, 44100);
      $scope.rhythm.patterns.forEach(function(pattern) {
        var buffer = $scope.getBuffer(pattern.sound);
        pattern.beats.forEach(function(beat, i) {
          if (beat > 0) {
            var source = context.createBufferSource();
            source.buffer  = buffer;
            source.connect(context.destination);
            var when = i * tickLength;
            source.start(when);
          }
        });
      });
      context.startRendering();
      context.oncomplete = function(e) {
        resolve(e.renderedBuffer);
      };
    });
  };

  // Pause the pattern
  $scope.pause = function() {
    if ($scope.playbackSource) {
      $scope.playbackSource.stop();
    }

    var tickLength = $scope.getTickLength();
    // FIXME: this isn't quite right
    $scope.cursor += ((context.currentTime - $scope.startedPlaying) % tickLength) / tickLength;
    $scope.cursor = $scope.cursor % 16;


    $scope.playing = false;
  };

  // Pause and return to beginning
  $scope.stop = function() {
    $scope.pause();
    $scope.cursor = 0;
  };

  /* Instead of setInterval, run a continuous loop
   * on requestAnimationFrame, referencing the
   * (reliable) context.currentTime
   */
  $scope.update = function() {
    if ($scope.playing) {
      var tickLength = $scope.getTickLength();
      while (context.currentTime > ($scope.lastTick + tickLength)) {
        $scope.lastTick = $scope.lastTick + tickLength;
        $scope.cursor++;
        $scope.cursor = $scope.cursor % 16;
        $scope.$apply();
      }
    }
    requestAnimationFrame($scope.update);
  };
  $scope.update();

  $scope.rhythm = {
    patterns: [
      {
        sound: "kick",
        beats: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
      },
      {
        sound: "snare",
        beats: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]
      },
      {
        sound: "hat",
        beats: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
      }
    ]
  };
});


function getBuffer(url, context) {
  if (!context) {
    context = new OfflineAudioContext(2, 1, 44100);
  }
  return fetch(url).then(function(response) {
    return response.arrayBuffer();
  }).then(function(arrayBuffer) {
    return new Promise(function(resolve, reject) {
      context.decodeAudioData(arrayBuffer, resolve, reject);
    });
  });
}

