(function() {
  var argv, exitProcess, logger, noop;

  logger = GLOBAL.logger = require('winston');

  logger.exitOnError = false;

  logger.remove(logger.transports.Console);

  logger.add(logger.transports.Console, {
    colorize: true,
    timestamp: true
  });

  logger.add(logger.transports.File, {
    filename: 'ingress-exporter.log'
  });

  noop = GLOBAL.noop = function() {
    return null;
  };

  exitProcess = GLOBAL.exitProcess = function() {
    logger.info('[DONE]');
    return process.exit(0);
  };

  require('./config.js');

  require('./munges.js');

  require('./lib/leaflet.js');

  require('./lib/utils.js');

  require('./lib/database.js');

  require('./lib/request.js');

  require('./lib/tile.js');

  require('./lib/entity.js');

  require('./lib/chat.js');

  require('./lib/mungedetector.js');

  argv = require('optimist').argv;

  MungeDetector.detect(function() {
    if (argv["new"] || argv.n) {
      if (argv.portals) {
        Tile.prepareNew(Tile.start);
      }
      if (argv.broadcasts) {
        return Chat.PrepareNew(Chat.start);
      }
    } else {
      if (argv.portals) {
        Tile.prepareFromDatabase(Tile.start);
      }
      if (argv.broadcasts) {
        return Chat.prepareFromDatabase(Chat.start);
      }
    }
  });

}).call(this);
