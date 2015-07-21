describe("contextService", function() {
  beforeEach(module("drumMachineApp"));
  var contextServiceHandle;
  var scope;
  beforeEach(inject(function($rootScope, contextService) {
    scope = $rootScope.$new();
    contextServiceHandle = contextService;
  }));
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
      scope.pause();
      expect(scope.updateCursor).toHaveBeenCalled();
    });
  });
});
