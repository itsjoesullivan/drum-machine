var drumMachineApp = angular.module("drumMachineApp", []);
drumMachineApp.controller("RhythmCtrl", function($scope) {

  // Where the playhead is
  $scope.cursor = 0;

  // Beats per minute
  $scope.tempo = 128;

  // Process a change to a pattern
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
    $scope.pause();
    $scope.interval = setInterval(function() {
      $scope.cursor++;
      $scope.cursor = $scope.cursor % 16;
      $scope.$apply();
    }, 1000 * 60 / $scope.tempo / 4);
  };

  // Pause the pattern
  $scope.pause = function() {
    clearInterval($scope.interval);
  };

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
