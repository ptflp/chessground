var util = require('./util');
var premove = require('./premove');
var anim = require('./anim');

function callUserFunction(f) {
  setTimeout(f(), 20);
}

function toggleOrientation() {
  this.orientation = this.orientation === 'white' ? 'black' : 'white';
}

function setPieces(pieces) {
  this.pieces.set(pieces);
  this.movable.dropped = null;
}

function baseMove(orig, dest) {
  return anim(this, function() {
    var success = this.pieces.move(orig, dest);
    if (success) {
      this.lastMove = [orig, dest];
      this.movable.dropped = null;
      this.check = null;
      callUserFunction(this.events.change);
    }
    return success;
  })();
}

function apiMove(orig, dest) {
  return baseMove.call(this, orig, dest);
}

function userMove(orig, dest) {
  if (canMove.call(this, orig, dest)) {
    if (baseMove.call(this, orig, dest)) {
      setSelected.call(this, null);
      callUserFunction(this.movable.events.after.bind(null, orig, dest));
    }
  } else if (canPremove.call(this, orig, dest)) {
    this.premovable.current = [orig, dest];
    setSelected.call(this, null);
  } else if (isMovable.call(this, dest) || isPremovable.call(this, dest))
    setSelected.call(this, dest);
  else setSelected.call(this, null);
}

function selectSquare(key) {
  if (this.selected) {
    if (this.selected !== key) userMove.call(this, this.selected, key)
  } else if (isMovable.call(this, key) || isPremovable.call(this, key))
    setSelected.call(this, key);
}

function setSelected(key) {
  this.selected = key;
  if (key && isPremovable.call(this, key))
    this.premovable.dests = premove(this.pieces, key);
  else
    this.premovable.dests = null;
}

function isMovable(orig) {
  var piece = this.pieces.get(orig);
  return piece && (
    this.movable.color === 'both' || (
      this.movable.color === piece.color &&
      this.turnColor === piece.color
    ));
}

function canMove(orig, dest) {
  return orig !== dest && isMovable.call(this, orig) && (
    this.movable.free || util.containX(this.movable.dests[orig], dest)
  );
}

function isPremovable(orig) {
  var piece = this.pieces.get(orig);
  return piece && this.premovable.enabled && (
    this.movable.color === piece.color &&
    this.turnColor !== piece.color
  );
}

function canPremove(orig, dest) {
  return orig !== dest &&
    isPremovable.call(this, orig) &&
    _util.containX(premove(this.pieces, orig), dest);
}

function isDraggable(orig) {
  var piece = this.pieces.get(orig);
  return piece && this.draggable.enabled && (
    this.movable.color === 'both' || (
      this.movable.color === piece.color && (
        this.turnColor === piece.color || this.premovable.enabled
      )
    )
  );
}

function playPremove() {
  var move = this.premovable.current;
  if (move) {
    var orig = move[0],
      dest = move[1];
    if (canMove.call(this, orig, dest)) {
      if (baseMove.call(this, orig, dest)) {
        callUserFunction(this.movable.events.after.bind(null, orig, dest));
      }
    }
    this.premovable.current = null;
  }
}

module.exports = {
  toggleOrientation: toggleOrientation,
  setPieces: setPieces,
  selectSquare: selectSquare,
  setSelected: setSelected,
  isDraggable: isDraggable,
  canMove: canMove,
  userMove: userMove,
  apiMove: apiMove,
  playPremove: playPremove
};
