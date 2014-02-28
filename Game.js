(function (glob) {
  // the phaser game.
  var MainPlay = function MainPlay () {};
  _.extend(MainPlay.prototype, {

    baseSpeeds: {
      coinGravity: 1000,
      pipeVelocity: -250,
      coinVelocity: -385
    },

    preload: function() { 
      this.spriteSize = 40;
      this.baseSpeed = MainPlay.speed || this.speed || 1;
      this.game.stage.backgroundColor = '#D0D0D0';
      this.game.load.spritesheet('coin', 'images/gold-sprite.png', 40, 40);
      this.game.load.image('pipeBody', 'images/blue-tube.png');
      this.game.load.image('pipeEnd', 'images/blue-end.png');
      this.attachInput();
    },

    create: function() { 
      this.createPipes();
      this.createScore();
      this.createCoin();
      this.resetSpeed();
      this.addPipeRow();
    },

    createCoin: function () {
      this.coin = this.game.add.sprite(90, 90, 'coin');
      this.coin.animations.add('spin');
      this.coin.body.velocity.y = 0;
      this.coin.animations.play('spin', 11/1.75, true);
    },

    createPipes: function () {
      this._pipeGroupNames = [];
      if (this._currentPipeGroup) {
        delete this._currentPipeGroup;
      }
      this.pipeBodies = this.game.add.group();
      this.pipeBodies.createMultiple(50, 'pipeBody');

      this.pipeEnds = this.game.add.group();
      this.pipeEnds.createMultiple(20, 'pipeEnd');
    },
    
    createAddPipeTimer: function () {
      this.addPipeTimer = this.game.time.events.add(1750, this.addPipeRow, this)
    },

    resetSpeed: function () {
      this.setSpeed(this.baseSpeed);
    },

    setExtremeSpeed: function () {
      this.setSpeed(this.baseSpeed * 1.25);
    },

    setSpeed: function (multiplier) {
      this.speed = multiplier;
      if (this.coin) {
        this.coin.body.gravity.y = this.baseSpeeds.coinGravity * multiplier; 
      }
      this.setPipeVelocity(this.baseSpeeds.pipeVelocity * multiplier);
    },

    attachInput: function () {
      //this.game.input.mouse.mouseDownCallback = this.jump.bind(this);

      // Points do mouse or touch, so dont just do the mouse
      var pointer1 = this.game.input.addPointer(),
        spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
        escape = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC),
        e = this.game.input.keyboard.addKey(Phaser.Keyboard.E);

      this.game.input.onDown.add(this.jump, this);// get the point to work
      spaceBar.onDown.add(this.jump, this); // add the spacebar call back
      e.onDown.add(this.setExtremeSpeed, this);
      escape.onDown.add(this.setExtremeSpeed, this);
    },

    createScore: function () {
      this.score = 0;
      this.scoreLabel = this.game.add.text(20, 20, "0", {
        font: '48px Helvetica',
        className: 'score-label',
        fill: '#666666'
      });
    },

    updateScore: function (score) {
      this.score += score;
      this.scoreLabel.content = this.score.toFixed(0);
    },
    
    update: function() {
      if (!this.coin.inWorld) {
        this.gameOver();
      } else {
        this.game.physics.overlap(this.coin, this.pipeBodies, this.gameOver, null, this);
        this.game.physics.overlap(this.coin, this.pipeEnds, this.gameOver, null, this);
      }
      this.checkForScore();
    },

    checkForScore: function () {
      if (!this._currentPipeGroup) {
        this.nextPipeGroup();
      }
      var closestPipe = this.getTrackerPipe(this._currentPipeGroup);
      if (closestPipe && closestPipe.x < this.coin.x) {
        this.updateScore(1);
        delete this._currentPipeGroup;
      }
    },

    nextPipeGroup: function () {
      if (this._pipeGroupNames.length) {
        this._currentPipeGroup = this._pipeGroupNames.shift();
      }
    },

    getTrackerPipe: function (groupName) {
      var trackerPipe;
      if (!this._trackerPipe || this._trackerPipe._groupName != groupName) {
        trackerPipe = this.pipeEnds.iterate('_groupName', groupName, Phaser.Group.RETURN_CHILD);
        this._trackerPipe = trackerPipe;
      } else {
        trackerPipe = this._trackerPipe;
      }
      return trackerPipe;
    },

    gameOver: function (sprite) {
      if (this._hasBeenRestarted) {
        return true;
      }
      this._hasBeenRestarted = true
      this.game.time.events.remove(this.addPipeTimer);
      this.coin.body.velocity.x = 0;
      this.setPipeVelocity(0);
      window.setTimeout(this.restartGame.bind(this), 1500);
    },

    setPipeVelocity: function (velocity) {
      this.pipeBodies.setAll('body.velocity.x', velocity);
      this.pipeEnds.setAll('body.velocity.x', velocity);
    },

    restartGame: function () {
      this._hasBeenRestarted = false;
      this.game.state.start('main');
    },

    jump: function () {
      if (!this._hasBeenRestarted && this.coin) {
        this.coin.body.velocity.y = this.baseSpeeds.coinVelocity * this.speed;
      }
    },

    addPipeBody: function (x, i, groupName) {
      var pipe = this.pipeBodies.getFirstDead();
      if (pipe) {
        this.updatePipeLocation(pipe, x, i);
      }
    },

    addPipeEnd: function (x, i, groupName) {
      var pipe = this.pipeEnds.getFirstDead();
      if (pipe) {
        this.updatePipeLocation(pipe, x, i, groupName);
      }
    },

    updatePipeLocation: function (pipe, x, i, groupName) {
      pipe.reset(x, i * pipe.height);
      pipe.body.velocity.x = this.baseSpeeds.pipeVelocity * this.speed;
      pipe.outOfBoundsKill = true;
      pipe._groupName = groupName;
    },

    addPipeRow: function () {
      var pipeFit = Math.ceil(this.game.height / 45),
        hole = Math.floor((Math.random() * (pipeFit - 3)) + 1.5),
        pipeGroup = _.uniqueId('pipe');

      this._pipeGroupNames.push(pipeGroup);

      _(pipeFit).times(function (i) {
        if (i != hole && i != (hole+1) && i != (hole -1)) {
          if (i == (hole - 2) || i == (hole + 2)) {
            this.addPipeEnd(this.game.width, i, pipeGroup);
          } else {
            this.addPipeBody(this.game.width, i, pipeGroup);
          }
        }
      }, this);
      this.createAddPipeTimer();
    },

    destroy: function () {
      this._hasBeenRestarted = true;
    }
  });

  // The wrapper to create the game.
  var Game = function Game (o) {
    this.options = _.extend({}, this.options, o || {});
    this.initialize();
  };
  _.extend(Game.prototype, {

    options: {
      autostart: false,
      width: 500,
      height: 400,
      speed: 1
    },

    initialize: function () {
      this.build();
      if (this.options.autostart) {
        this.start();
      }
    },

    build: function () {
      this.phaser = new Phaser.Game(
        this.options.width,
        this.options.height,
        Phaser.AUTO,
        this.options.el
      );
      this.state = {
        main: MainPlay
      };
      this.state.main.speed = this.options.speed;
      this.phaser.state.add('main', this.state.main);
    },

    start: function () {
      this.phaser.state.start('main', true);
    }

  });
  // make it accessible 
  glob.Game = Game;
})(this);
