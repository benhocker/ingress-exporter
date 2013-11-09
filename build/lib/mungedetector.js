(function() {
  var MungeDetector, NemesisMethodName, async, detectMungeIndex, getMungeIITC, tryMungeSet;

  async = require('async');

  NemesisMethodName = null;

  if (Munges.ActiveSet == null) {
    Munges.ActiveSet = Munges.Data.length - 1;
  }

  MungeDetector = GLOBAL.MungeDetector = {
    detect: function(callback) {
      logger.info('[MungeDetector] Initialize: Detecting munge data...');
      return async.series([
        function(callback) {
          logger.info('[MungeDetector] Trying to use internal munge data.');
          return tryMungeSet(Munges.Data[Munges.ActiveSet], function(err) {
            if (err == null) {
              callback('done');
              return;
            }
            logger.warn('[MungeDetector] Failed.');
            return callback();
          });
        }, function(callback) {
          logger.info('[MungeDetector] Trying to use alternative internal munge data.');
          return detectMungeIndex(function(err) {
            if (err == null) {
              callback('done');
              return;
            }
            logger.warn('[MungeDetector] Failed.');
            return callback();
          });
        }, function(callback) {
          logger.info('[MungeDetector] Trying to parse newest IITC munge data.');
          return getMungeIITC(function(err) {
            if (err == null) {
              callback('done');
              return;
            }
            logger.warn('[MungeDetector] Failed.');
            return callback();
          });
        }, function(callback) {
          return callback('fail');
        }
      ], function(err) {
        if (err === 'done') {
          logger.info('[MungeDetector] Detect successfully.');
          return callback && callback();
        } else {
          logger.error('[MungeDetector] Could not detect munge data. Tasks are terminated.');
          return process.exit(0);
        }
      });
    }
  };

  tryMungeSet = function(munge, callback) {
    var task;
    task = Request.generate({
      munge: munge,
      action: 'getGameScore',
      data: {},
      onSuccess: function(response) {
        return callback && callback();
      },
      onError: function(err) {
        return callback && callback(err);
      }
    });
    return Request.post('/r/' + task.m, task.d, function(error, response, body) {
      if (error) {
        task.error && task.error(error);
        return;
      }
      if (!Request.processResponse(error, response, body)) {
        logger.error('[DEBUG] Unknown server response');
        return;
      }
      return task.success && task.success(body);
    });
  };

  detectMungeIndex = function(callback) {
    var MAGIC_CODE;
    MAGIC_CODE = 'nemesis.dashboard.requests.MethodName = ';
    return Request.get('/jsc/gen_dashboard.js', function(error, response, body) {
      var index, munge, p1, p2, _i, _len, _ref;
      if (error) {
        callback('fail');
        return;
      }
      body = body.toString();
      p1 = body.indexOf(MAGIC_CODE);
      p2 = body.indexOf('}', p1);
      NemesisMethodName = eval("(" + body.substring(p1 + MAGIC_CODE.length, p2 + 1) + ")");
      _ref = Munges.Data;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        munge = _ref[index];
        if (NemesisMethodName.GET_GAME_SCORE === munge['dashboard.getGameScore']) {
          Munges.ActiveSet = index;
          callback();
          return;
        }
      }
      return callback('fail');
    });
  };

  getMungeIITC = function(callback) {
    var MAGIC_CODE, needle;
    MAGIC_CODE = 'window.requestParameterMunges = ';
    needle = require('needle');
    return needle.get('https://secure.jonatkins.com/iitc/release/total-conversion-build.user.js', {
      compressed: true,
      timeout: 20000
    }, function(error, response, body) {
      var MungeSet, index, munge, p1, p2, _i, _len;
      if (error) {
        callback('fail');
        return;
      }
      body = body.toString();
      p1 = body.indexOf(MAGIC_CODE);
      p2 = body.indexOf(']', p1);
      MungeSet = eval("(" + body.substring(p1 + MAGIC_CODE.length, p2 + 1) + ")");
      for (index = _i = 0, _len = MungeSet.length; _i < _len; index = ++_i) {
        munge = MungeSet[index];
        if (NemesisMethodName.GET_GAME_SCORE === munge['dashboard.getGameScore']) {
          Munges.Data = MungeSet;
          Munges.ActiveSet = index;
          callback();
          return;
        }
      }
      return callback('fail');
    });
  };

}).call(this);
