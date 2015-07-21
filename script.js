AudioContext = window.AudioContext || webkitAudioContext;
OfflineAudioContext = window.OfflineAudioContext || webkitOfflineAudioContext;

var drumMachineApp = angular.module("drumMachineApp", []);

// A global AudioContext services + controllers can reach
drumMachineApp.service('contextService', function() {
  this.context = new AudioContext();
});

// Something to hold this rhythm
drumMachineApp.service('rhythmService', function() {
  this.rhythm = {
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

// Place for some audio-specific code
drumMachineApp.service('audioService', function(contextService, $q) {
  this.context = contextService.context;

  this.loadBuffer = function(url) {
    var context = new OfflineAudioContext(2, 1, 44100);
    return $q(function(resolve, reject) {
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.onload = function() {
        context.decodeAudioData(request.response, resolve, reject);
      };
      request.onerror = reject;
      request.send();
    });
  };

  this._buffers = {};
  // Retrieve a pre-loaded buffer
  this.getBuffer = function(name) {
    return this._buffers[name];
  };

  // Load up the sounds... app will fail in an ugly way if this doesn't work.
  this.loadBuffer("snare.wav").then(function(buffer) {
    this._buffers["snare"] = buffer;
  }.bind(this));
  this.loadBuffer("kick.wav").then(function(buffer) {
    this._buffers["kick"] = buffer;
  }.bind(this));
  this.loadBuffer("hat.wav").then(function(buffer) {
    this._buffers["hat"] = buffer;
  }.bind(this));

});

drumMachineApp.controller("RhythmCtrl", function($scope, $q, contextService, audioService, rhythmService) {

  $scope.context = contextService.context;

  // stackoverflow.com/questions/12740329/math-functions-in-angular-bindings
  $scope.Math = Math;

  // Where the playhead is
  $scope.cursor = 0;

  // Beats per minute
  $scope.tempo = 128;

  // Our actual rhythm pattern
  $scope.rhythm = rhythmService.rhythm;

  // Process a change to a pattern
  // TODO: Can ng-model handle this?
  $scope.patternChange = function(sound, index) {
    $scope.rhythm.patterns.some(function(pattern) {
      if (pattern.sound === sound) {
        originalVal = pattern.beats[index];
        if (originalVal > 0) {
          pattern.beats[index] = 0;
        } else {
          // We could put velocity here, perhaps based on the cmd key
          pattern.beats[index] = 1;
        }
        return true;
      }
    });
    if ($scope.playing) {
      $scope.pause();
      $scope.play();
    }
  };

  // Begin the pattern running
  $scope.play = function() {
    // Remember where we started this play (to keep track of where the
    // actual cursor is)
    $scope.startedPlaying = $scope.context.currentTime;
    $scope.lastTick = $scope.context.currentTime - ($scope.cursor % 1) * $scope.getTickLength();
    $scope.cursorAtPlay = $scope.cursor;
    $scope.playing = true;
    $scope.renderPattern().then($scope.playLoop).then(function() {
      $scope.playing = true;
    });
  };

  // Initiate playback of the rendered loop buffer, setting
  // it to $scope.playbackSource for later stop()ing
  $scope.playLoop = function(loopBuffer) {
    var source = $scope.context.createBufferSource();
    source.buffer = loopBuffer;
    source.connect($scope.context.destination);
    source.loop = true;
    source.start($scope.context.currentTime, $scope.cursor * $scope.getTickLength());
    if ($scope.playbackSource) {
      $scope.playbackSource.stop($scope.context.currentTime);
    }
    $scope.playbackSource = source;
  };

  /*
   * Return the time length of a tick on the drum machine (1/16th note)
   */
  $scope.getTickLength = function() {
    return 60 / $scope.tempo / 4;
  };

  /*
   * Return a Promise that resolves with an audio buffer
   * of the current loop.
   */
  $scope.renderPattern = function() {
    var startTime = $scope.context.currentTime;
    return $q(function(resolve, reject) {
      var tickLength = $scope.getTickLength();
      if ($scope.tempo < 10) {
        reject(new Error("Tempo is... too slow."));
      }
      var context = new OfflineAudioContext(1, 16 * tickLength * 44100, 44100);
      $scope.rhythm.patterns.forEach(function(pattern) {
        var buffer = audioService.getBuffer(pattern.sound);
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
        console.log("Rendering loop took " +
          ($scope.context.currentTime - startTime).toFixed(3) * 1000 +
        "ms");
      };
    });
  };

  // Pause the pattern
  $scope.pause = function() {
    if (!$scope.playing) {
      return;
    }
    $scope.updateCursor();
    $scope.playing = false;
  };

  /* Update cursor on pause
   * TODO: better name?
   *
   * Adjusts the cursor position in order to maintain
   * sub-tick precision.
   */
  $scope.updateCursor = function() {
    // Loop ran for this long
    var playedTime = $scope.context.currentTime - $scope.startedPlaying;
    var playedTicks = playedTime / $scope.getTickLength();
    $scope.cursor = ($scope.cursorAtPlay + playedTicks) % 16;
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
      // Add ticks that have passed since last check.
      while ($scope.context.currentTime > ($scope.lastTick + tickLength)) {
        $scope.lastTick = $scope.lastTick + tickLength;
        $scope.cursor++;
        $scope.cursor = $scope.cursor % 16;
        $scope.$apply();
      }
    }
    requestAnimationFrame($scope.update);
  };
  // Begin animation loop.
  $scope.update();
});
