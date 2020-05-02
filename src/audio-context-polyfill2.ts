
((window: any, undefined) => {

  const AudioContext = window.AudioContext = window.AudioContext || window.webkitAudioContext
  const OfflineAudioContext = window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext
  
  const _BaseAudioContext = window.BaseAudioContext || (OfflineAudioContext && Object.getPrototypeOf(OfflineAudioContext));
  const BaseAudioContext = window.BaseAudioContext = (typeof _BaseAudioContext === "function" && _BaseAudioContext.prototype) ? _BaseAudioContext : AudioContext;
  
  const AuCtxProt = AudioContext.prototype
  
  Object.defineProperties(AuCtxProt, {
      createGain: {
          value: AuCtxProt.createGain || AuCtxProt.createGainNode
      },
      createDelay: {
          value: AuCtxProt.createDelay || AuCtxProt.createDelayNode
      },
      createScriptProcessor: {
          value: AuCtxProt.createScriptProcessor || AuCtxProt.createJavaScriptNode
      }
  });
  
  const audioContext = new AudioContext(),
  oscillatorPrototype = audioContext.createOscillator().constructor.prototype,
  bufferSourcePrototype = audioContext.createBufferSource().constructor.prototype,
  gainGainConstructorPrototype = audioContext.createGain().gain.constructor.prototype;
  
  Object.defineProperties(oscillatorPrototype, {
      setPeriodicWave: {
          value: oscillatorPrototype.setPeriodicWave || oscillatorPrototype.setWaveTable
      },
      start: {
          value: oscillatorPrototype.start || oscillatorPrototype.noteOn
      },
      stop: {
          value: oscillatorPrototype.stop || oscillatorPrototype.noteOff
      }
  });
  
  Object.defineProperties(bufferSourcePrototype, {
      start: {
          value: bufferSourcePrototype.start || function start() {
              return arguments.length > 1 ? bufferSourcePrototype.noteGrainOn.apply(this, arguments) : bufferSourcePrototype.noteOn.apply(this, arguments);
          }
      },
      stop: {
          value: bufferSourcePrototype.stop || bufferSourcePrototype.noteOff
      }
  });
  
  Object.defineProperties(gainGainConstructorPrototype, {
      setTargetAtTime: {
          value: gainGainConstructorPrototype.setTargetAtTime || gainGainConstructorPrototype.setTargetValueAtTime
      }
  });



  var tmpctx = new AudioContext();

  // Support alternate names
  // start (noteOn), stop (noteOff), createGain (createGainNode), etc.
  var isStillOld = function(normative, old) {
    return normative === undefined && old !== undefined;
  };

  var bufProto = tmpctx.createBufferSource().constructor.prototype;

  if (isStillOld(bufProto.start, bufProto.noteOn) ||
  isStillOld(bufProto.stop, bufProto.noteOff)) {
    var nativeCreateBufferSource = AuCtxProt.createBufferSource;

    AuCtxProt.createBufferSource = function createBufferSource() {
      var returnNode = nativeCreateBufferSource.call(this);
      returnNode.start = returnNode.start || returnNode.noteOn;
      returnNode.stop = returnNode.stop || returnNode.noteOff;

      return returnNode;
    };
  }

  // Firefox 24 doesn't support OscilatorNode
  if (typeof tmpctx.createOscillator === 'function') {
    var oscProto = tmpctx.createOscillator().constructor.prototype;

    if (isStillOld(oscProto.start, oscProto.noteOn) ||
    isStillOld(oscProto.stop, oscProto.noteOff)) {
      var nativeCreateOscillator = AuCtxProt.createOscillator;

      AuCtxProt.createOscillator = function createOscillator() {
        var returnNode = nativeCreateOscillator.call(this);
        returnNode.start = returnNode.start || returnNode.noteOn;
        returnNode.stop = returnNode.stop || returnNode.noteOff;

        return returnNode;
      };
    }
  }

  if (AuCtxProt.createGain === undefined && AuCtxProt.createGainNode !== undefined) {
    AuCtxProt.createGain = AuCtxProt.createGainNode;
  }

  if (AuCtxProt.createDelay === undefined && AuCtxProt.createDelayNode !== undefined) {
    AuCtxProt.createDelay = AuCtxProt.createGainNode;
  }

  if (AuCtxProt.createScriptProcessor === undefined &&
  AuCtxProt.createJavaScriptNode !== undefined) {
    AuCtxProt.createScriptProcessor = AuCtxProt.createJavaScriptNode;
  }

  // Black magic for iOS
  var is_iOS = (navigator.userAgent.indexOf('like Mac OS X') !== -1);
  if (is_iOS) {
    var OriginalAudioContext = AudioContext;
    window.AudioContext = function AudioContext() {
      var iOSCtx = new OriginalAudioContext();

      var body = document.body;
      var tmpBuf = iOSCtx.createBufferSource();
      var tmpProc = iOSCtx.createScriptProcessor(256, 1, 1);

      body.addEventListener('touchstart', instantProcess, false);

      function instantProcess() {
        tmpBuf.start(0);
        tmpBuf.connect(tmpProc);
        tmpProc.connect(iOSCtx.destination);
      }

      // This function will be called once and for all.
      tmpProc.onaudioprocess = function() {
        tmpBuf.disconnect();
        tmpProc.disconnect();
        body.removeEventListener('touchstart', instantProcess, false);
        tmpProc.onaudioprocess = null;
      };

      return iOSCtx;
    };
  }



})(window)