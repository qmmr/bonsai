define([
  '../tools',
  './display_object'
], function(tools, DisplayObject) {
  'use strict';

  var isArray = tools.isArray;
  var max = Math.max, min = Math.min;
  function getAncestors(displayObject) {
    var ancestors = [];
    do {
      ancestors.push(displayObject);
      displayObject = displayObject.parent;
    } while (displayObject);

    return ancestors;
  }
  function inThisArray(item) {
    return this.indexOf(item) !== -1;
  }

  /**
   * Constructs a display list.
   *
   * This is the standard display list implementation: It does not allow for
   * sparse child arrays and will always remove all gaps.
   *
   * @param {DisplayObject} [owner=undefined] The object owning the display list.
   * @constructor
   */
  function DisplayList(owner) {
    this.children = [];
    this.owner = owner;
  }

  DisplayList.prototype = {
    /**
     * Adds a `DisplayObject` or an array of DisplayObjects to the display list.
     *
     * When called without index, the new child(ren) are appended at the end of
     * the list.
     *
     * When called with index, the children will be inserted into the display
     * list at that index. Any existing object at the index will be shifted
     * towards the end.
     *
     * @param {DisplayObject|Array} child The new child to add, or an array of
     *    DisplayObjects to add.
     * @param {Number} [insertAt=undefined] A natural number at which
     *    index the child/children will be added.
     */
    add: function(child, insertAt) {
      var isChildArray = isArray(child);
      var owner = this.owner;
      var ancestors = getAncestors(owner);
      var numNewChildren = isChildArray ? child.length : 1;
      var newChildrenStop;

      if (!isChildArray && ancestors.indexOf(child) !== -1) {
        return;
      } else if (isChildArray && child.some(inThisArray, ancestors)) {
        return;
      } else if (numNewChildren === 0) {
        return;
      }

      var children = this.children;
      var numExistingChildren = children.length;
      insertAt = arguments.length > 1 ?
        min(insertAt >>> 0, numExistingChildren) : numExistingChildren;

      if (isChildArray) {
        children.splice.apply(children, [insertAt, 0].concat(child));
      } else {
        children.splice(insertAt, 0, child);
      }

      if (insertAt > 0) {
        children[insertAt - 1].next = isChildArray ? child[0] : child;
      }
      newChildrenStop = insertAt + numNewChildren;
      for (var nextChild, i = insertAt; i < newChildrenStop; i += 1) {
        child = nextChild || children[i];

        var previousParent = child.parent;
        if (previousParent) {
          previousParent.displayList.remove(child);
        }
        nextChild = children[i + 1];
        child.next = nextChild;
        child.parent = owner;
        child._activate(owner.stage);
      }

    },

    /**
     * Removes all children from the display list.
     */
    clear: function() {
      var children = this.children;
      for (var i = 0, child; (child = children[i]); i += 1) {
        child._deactivate();
        child.next = child.parent = void 0;
      }
      children.length = 0
    },

    /**
     * Checks whether a display object is contained by the display list or any
     * child of the display list.
     *
     * @param key
     * @return {*}
     */
    contains: function(displayObject) {
      var children = this.children;
      return children.indexOf(displayObject) !== -1 ||
        children.some(function(child) {
          return child.displayList && child.displayList.contains(displayObject);
        });
    },

    /**
     * Removes a child from the display list
     *
     * @param {DisplayObject} displayObject The display object to remove
     * @return {Boolean} Whether the display object was contained by the
     *    display list and removed successfully.
     */
    remove: function(displayObject) {
      var children = this.children;
      var childIndex = children.indexOf(displayObject);
      if (childIndex === -1) { return false; }

      if (childIndex > 0) {
        children[childIndex - 1].next = displayObject.next;
      }
      displayObject.next = displayObject.parent = void 0;
      displayObject._deactivate();
      children.splice(childIndex, 1);
      return true;
    }
  };

  function activate(stage) {
    DisplayObject.prototype._activate.call(this, stage);
    var children = this.displayList.children;
    for (var i = 0, length = children.length; i < length; i += 1) {
      children[i]._activate(stage);
    }
  }

  function deactivate() {
    DisplayObject.prototype._deactivate.call(this);
    var children = this.displayList.children;
    for (var i = 0, length = children.length; i < length; i += 1) {
      children[i]._deactivate();
    }
  }

  /**
   * Ready made methods that can be used by / mixed into objects owning a
   * display list and inherit from DisplayObject
   *
   * @name display_list.methods
   */
  var methods = {
    /**
     * Activates the object and all of its children.
     *
     * @param {Stage} stage
     * @private
     */
    _activate: activate,

    /**
     * Deactivates the object and all of its children
     *
     * @private
     */
    _deactivate: deactivate,

    /**
     * Adds a child or an array of children to the object.
     *
     * @param {DisplayObject|Array} child The display object (or array of
     *    display objects) to add.
     * @param {Number} [index=undefined] A natural number at which index the
     *    child should be inserted.
     * @return {this}
     */
    addChild: function(child, index) {
      if (arguments.length === 1) {
        this.displayList.add(child);
      } else {
        this.displayList.add(child, index);
      }
      return this;
    },
    /**
     * Returns or sets the array of child display objects.
     * @param {Array} [newChildren=undefined] If passed, the display list is
     *    cleared and the new children are appended.
     * @return {this|Array}
     */
    children: function(newChildren) {
      var displayList = this.displayList;
      if (arguments.length) {
        displayList.clear();
        displayList.add(newChildren);
        return this;
      }
      return displayList.children.slice();
    },
    /**
     * Removes all children from the object
     * @return {this}
     */
    clear: function() {
      this.displayList.clear();
      return this;
    },

    getComputed: function(key) {
      var children = this.displayList.children;
      var isOffsetKey =
        key === 'top' ||
        key === 'right' ||
        key === 'bottom' ||
        key === 'left';

      if (isOffsetKey) {
        var attributeName = (key === 'top' || key === 'bottom') ? 'y' : 'x';
        var compare = (key === 'top' || key === 'left') ? min : max;

        return tools.reduce(children, function(current, child, i) {
          var childValue = child.attr(attributeName) + child.getComputed(key);
          if (i === 0) {
            return childValue;
          }
          return compare(current, childValue);
        }, 0);
      } else {
        var size = tools.reduce(children, function(size, child, i) {
          var childSize = child.getComputed('size');
          var childX = child.attr('x');
          var childY = child.attr('y');

          var isFirst = i === 0;

          var childTop = childY + childSize.top;
          size.top = isFirst ? childTop : min(size.top, childTop);

          var childRight = childX + childSize.right;
          size.right = isFirst ? childRight : max(size.right, childRight);

          var childBottom = childY + childSize.bottom;
          size.bottom = isFirst ? childBottom : max(size.bottom, childBottom);

          var childLeft = childX + childSize.left;
          size.left = isFirst ? childLeft : min(size.left, childLeft);

          return size;
        }, {top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0});

        size.height = size.bottom - size.top;
        size.width = size.right - size.left;

        return key === 'size' ? size : size[key];
      }
    },
    getIndexOfChild: function(displayObject) {
      return this.displayList.children.indexOf(displayObject);
    },

    markUpdate: function() {
      var children = this.displayList.children;
      for (var i = 0, child; (child = children[i]); i += 1) {
        child.markUpdate();
      }
      return DisplayObject.prototype.markUpdate.call(this);
    },
    removeChild: function(child) {
      this.displayList.remove(child);
      return this;
    }
  };

  var timelineMethods = tools.mixin({}, methods);
  timelineMethods._activate = function(stage) {
    activate.call(this, stage);
    if (stage) {
      stage.registry.movies.add(this);
    }
  };
  timelineMethods._deactivate = function() {
    if (this.stage) {
      this.stage.registry.movies.remove(this);
    }
    deactivate.call(this);
  };

  return {
    DisplayList: DisplayList,
    methods: methods,
    timelineMethods: timelineMethods
  };
});
