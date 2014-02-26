(function (glob) {
  // the phaser game.
  var MainPlay = function MainPlay () {};
  _.extend(MainPlay.prototype, {

    preload: function() { 
      this.spriteSize = 40;
      this.speed = MainPlay.speed || this.speed || 1;
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
      this.createTimer();
      this.addPipeRow();
      this.score = -1;
    },

    createCoin: function () {
      this.coin = this.game.add.sprite(90, 90, 'coin');
      this.coin.animations.add('spin');
      this.coin.body.gravity.y = 1000;
      this.coin.body.velocity.y = 0;
      this.coin.animations.play('spin', 11/1.75, true);
    },

    createPipes: function () {
      this.pipeBodies = this.game.add.group();
      this.pipeBodies.createMultiple(50, 'pipeBody');

      this.pipeEnds = this.game.add.group();
      this.pipeEnds.createMultiple(20, 'pipeEnd');
    },

    createTimer: function () {
      this.timer = this.game.time.events.loop(1750, this.addPipeRow, this)
    },

    attachInput: function () {
      //this.game.input.mouse.mouseDownCallback = this.jump.bind(this);

      // Points do mouse or touch, so dont just do the mouse
      var pointer1 = this.game.input.addPointer(),
        spaceBar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

      this.game.input.onDown.add(this.jump, this);// get the point to work
      spaceBar.onDown.add(this.jump, this); // add the spacebar call back
    },

    createScore: function () {
      this.score = -1;
      this.scoreLabel = this.game.add.text(20, 20, "0", {
        font: '48px Helvetica',
        className: 'score-label',
        fill: '#666666'
      });
    },

    updateScore: function (score) {
      this.score += score;
      this.scoreLabel.content = Math.max(this.score, 0).toFixed(0);
    },
    
    update: function() {
      if (!this.coin.inWorld) {
        this.gameOver();
      } else {
        this.game.physics.overlap(this.coin, this.pipeBodies, this.gameOver, null, this);
        this.game.physics.overlap(this.coin, this.pipeEnds, this.gameOver, null, this);
      }
    },

    gameOver: function (sprite) {
      if (this._hasBeenRestarted) {
        return true;
      }
      this._hasBeenRestarted = true
      this.game.time.events.remove(this.timer);
      this.coin.body.velocity.x = 0;
      this.pipeBodies.setAll('body.velocity.x', 1);
      this.pipeEnds.setAll('body.velocity.x', 1);
      window.setTimeout(this.restartGame.bind(this), 1500);
    },

    restartGame: function () {
      this._hasBeenRestarted = false;
      this.game.state.start('main');
    },

    jump: function () {
      if (!this._hasBeenRestarted && this.coin) {
        this.coin.body.velocity.y = -385;
      }
    },
    
    addPipeBody: function (i, pipeEnd) {
      var pipe = this.pipeBodies.getFirstDead();
      if (pipe) {
        this.updatePipeLocation(pipe, i);
      }
    },

    addPipeEnd: function (i) {
      var pipe = this.pipeEnds.getFirstDead();
      if (pipe) {
        this.updatePipeLocation(pipe, i);
      }
    },

    updatePipeLocation: function (pipe, i) {
      pipe.reset(this.game.width, i * pipe.height);
      pipe.body.velocity.x = -250 * this.speed;
      pipe.outOfBoundsKill = true;
    },

    addPipeRow: function () {
      var pipeFit = Math.ceil(this.game.height / 45),
        hole = Math.floor((Math.random() * (pipeFit - 3)) + 1.5);
      _(pipeFit).times(function (i) {
        if (i != hole && i != (hole+1) && i != (hole -1)) {
          if (i == (hole - 2) || i == (hole + 2)) {
            this.addPipeEnd(i);
          } else {
            this.addPipeBody(i);
          }
        }
      }, this);
      this.updateScore(1);
    },
    destroy: function () {
      this._hasBeenRestarted = true;
      console.log('destroy');
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
