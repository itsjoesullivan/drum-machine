var context = new AudioContext();
var drumMachineApp = angular.module("drumMachineApp", []);
drumMachineApp.controller("RhythmCtrl", function($scope) {

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
      if (pattern.sound === "sound") {
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
    console.log($scope.cursor);
  };

  $scope.getTickLength = function() {
    return 60 / $scope.tempo / 4;
  };

  // Pause the pattern
  $scope.pause = function() {
    console.log('offset', $scope.offsetAtStart);

    var tickLength = $scope.getTickLength();
    // FIXME: this isn't quite right
    $scope.cursor += ((context.currentTime - $scope.startedPlaying) % tickLength) / tickLength;
    $scope.cursor = $scope.cursor % 16;

    console.log($scope.cursor);

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
