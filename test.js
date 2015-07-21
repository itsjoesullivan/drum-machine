window.context = new AudioContext();
describe("contextService", function() {
  beforeEach(module("drumMachineApp"));
  var contextServiceHandle;
  var scope;
  beforeEach(inject(function($rootScope, contextService) {
    scope = $rootScope.$new();
    contextServiceHandle = contextService;
  }));
  afterEach(function() {
    contextServiceHandle.context.close();
  });
  it('has a context AudioContext', function() {
    expect(contextServiceHandle.context instanceof AudioContext).toEqual(true);
  });
});

describe("rhythmService", function() {
  beforeEach(module("drumMachineApp"));
  var rhythmServiceHandle;
  var scope;
  beforeEach(inject(function($rootScope, rhythmService) {
    scope = $rootScope.$new();
    rhythmServiceHandle = rhythmService;
  }));
  it('has a rhythm property', function() {
    expect(typeof rhythmServiceHandle.rhythm).toEqual('object');
  });
});

describe("RhythmCtrl", function() {
  beforeEach(module("drumMachineApp"));
  var RhythmCtrl;
  var scope;
  beforeEach(inject(function($rootScope, $controller) {
    scope = $rootScope.$new();
    RhythmCtrl = $controller('RhythmCtrl', {
      $scope: scope
    });
  }));
  afterEach(function() {
    scope.context.close();
  });

  it('initializes with tempo 128', function() {
    expect(scope.tempo).toEqual(128);
  });
  it('initializes with cursor at 0', function() {
    expect(scope.cursor).toEqual(0);
  });
  describe('getTickLength', function() {
    it('returns time length of a single quarter of a beat', function() {
      scope.tempo = 60;
      expect(scope.getTickLength()).toEqual(1/4);
    });
  });
  describe('pause', function() {
    it('calls updateCursor', function() {
      spyOn(scope, 'updateCursor');
      scope.playing = true;
      scope.stopPlayback = function() {};
      scope.pause();
      expect(scope.updateCursor).toHaveBeenCalled();
    });
    it('calls stopPlayback', function() {
      spyOn(scope, 'stopPlayback');
      scope.playing = true;
      scope.pause();
      expect(scope.stopPlayback).toHaveBeenCalled();
    });
    it('does not call updateCursor if not playing', function() {
      spyOn(scope, 'updateCursor');
      scope.playing = false;
      scope.stopPlayback = function() {};
      scope.pause();
      expect(scope.updateCursor).not.toHaveBeenCalled();
    });
  });
  describe('refreshAudio', function() {
    it('pauses and plays if playing', function() {
      spyOn(scope, 'pause');
      spyOn(scope, 'play');
      scope.playing = true;
      scope.refreshAudio();
      expect(scope.play).toHaveBeenCalled();
      expect(scope.pause).toHaveBeenCalled();
    });
    it('does not pause or play if not playing', function() {
      spyOn(scope, 'pause');
      spyOn(scope, 'play');
      scope.playing = false;
      scope.refreshAudio();
      expect(scope.play).not.toHaveBeenCalled();
      expect(scope.pause).not.toHaveBeenCalled();
    });
  });
});
