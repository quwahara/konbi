(function (definition) {
  if (typeof exports === "object") {
    // CommonJS
    module.exports = definition();
  } else if (typeof define === "function" && define.amd) {
    // RequireJS
    define(definition);
  } else {
    // <script>
    Trax = definition();
    console.log(Trax.release);
  }
})(function () {
  'use strict';
  return (function () {

    var ridMin, ridMax, repos, Trax, List, arrayByDecl;
    ridMin = 100000000000000;
    ridMax = ridMin * 10 - 1;

    function isString(v) {
      return (typeof v) === "string";
    }

    function isObject(v) {
      return v && !Array.isArray(v) && (typeof v) === "object";
    }

    function isFunction(fun) {
      return fun && {}.toString.call(fun) === '[object Function]';
    }

    function isPrimitive(v) {
      if (v == null) return false;
      var t = typeof v;
      return t === "string" || t === "number" || t === "boolean";
    }

    function map(ary, fun) {
      var i, len, ary2 = [];
      for (i = 0, len = ary.length; i < len; i++) {
        ary2.push(fun(ary[i]));
      }
      return ary2;
    }

    function toArray(arrayLike) {
      var i, array = [];
      for (i = 0; i < arrayLike.length; i++) {
        if (arrayLike.item) {
          array.push(arrayLike.item(0));
        } else {
          array.push(arrayLike[i]);
        }
      }
      return array;
    }

    function rid() {
      return "_" + (Math.floor(Math.random() * (ridMax - ridMin + 1)) + ridMin).toString(10);
    }

    function mergeRid(obj) {
      if (!obj._rid) {
        obj._rid = rid();
      }
      return obj;
    }

    function isInputValue(elem) {
      if (!elem || elem.tagName !== "INPUT") return false;
      if (elem.type && elem.type === "text") return true;
      return false;
    }

    function parseQryOrElems(qryOrElems) {
      var i, ees, qryEvtSpls, qryEvt, elem2, qry, evt, tmpElems;

      // element and eventType
      function ee(elem, eventType) {
        eventType = eventType || "change";
        return {
          elem: elem,
          eventType: eventType,
        };
      }

      // element and eventType callback
      function eec(eventType) {
        return function (elem) {
          return ee(elem, eventType);
        };
      }
      
      if (qryOrElems instanceof HTMLElement) {
        return [ee(qryOrElems)];
      }

      if (qryOrElems instanceof HTMLCollection) {
        return map(toArray(qryOrElems), ee);
      }

      if (!isString(qryOrElems)) {
        throw Error("The elems was not supported type");
      }

      ees = [];
      qryEvtSpls = qryOrElems.trim().split(/\s/);
      for (i = 0; i < qryEvtSpls.length; i++) {
        qryEvt = qryEvtSpls[i].split("@", 2);
        qry = qryEvt[0];
        evt = qryEvt[1];
        if (qry.indexOf("#") == 0) {
          elem2 = document.getElementById(qry.substr(1));
          if (elem2) {
            ees.push(ee(elem2, evt));
          }
        } else if (qry.indexOf(".") === 0) {
          tmpElems = document.getElementsByClassName(qry.substr(1));
          if (tmpElems) {
            ees = [].concat(ees, map(toArray(tmpElems), eec(evt)));
          }
        } else if ((/[\w]+/).test(qry)) {
          tmpElems = document.getElementsByTagName(qry);
          if (tmpElems) {
            ees = [].concat(ees, map(toArray(tmpElems), eec(evt)));
          }
        } else {
          throw Error("The query was not supported format");
        }
      }
      return ees;
    }

    repos = {};

    List = function (decl) {
      var r;
      r = repos[mergeRid(this)._rid] = {};
      r.plane = [];
      r.traxes = [];
      r.decl = deepClone(decl);
      // item infos
      r.iis = [];
      this.initDecl(r);
    };
    (function (P) {

      P.initDecl = function (r) {
        
      };

      P.createItem = function () {
        return new Trax(deepClone(this.decl));
      }

      P.push = function (item) {
        r.traxes.push(item);
        
        
      };

    })(List.prototype);

    Trax = function Trax(decl) {
      var r;
      if (!isObject(decl)) {
        throw Error("decl must be an Object");
      }
      r = repos[mergeRid(this)._rid] = {};
      r.doc = document;
      r.decl = decl;
      // property infos
      r.pis = {};
      this.initDecl(r);
    };
    (function (P) {

      P.initDecl = function (r) {
        var decl, v, pi;
        decl = r.decl;
        for (var name in decl) {
          if (!decl.hasOwnProperty(name)) continue;
          v = decl[name];
          if (isPrimitive(v)) {
            pi = preparePropInfo(r, name);
            preparePrimitiveProp(this, pi);
          } else if (isArray(v)) {

          }
        }
      };

      function preparePropInfo(r, propName) {
        var pi = mergeRid({
          decl: r.decl,
          propName: propName,
          value: r.decl[propName],
          // setter infos
          sis: [],
          cast: function (event) {
            var sis, si, i, len;
            sis = this.sis;
            len = sis.length;
            for (i = 0; i < len; ++i) {
              si = sis[i];
              if (si._rid === event.target._rid) continue;
              si.setter(event);
            }
          },
          setValue: function (v) {
            this.value = v;
            this.decl[this.propName] = v;
          },
          setter: function (event) {
            this.setValue(event.target.value);
          },
          addSetterInfo: function (si) {
            this.sis.push(si);
          },
        });
        pi.addSetterInfo(pi);
        r.pis[propName] = pi;
        return pi;
      }

      function preparePrimitiveProp(self, pi) {
        (function (self, pi) {
          Object.defineProperty(self, pi.propName, {
            get: function () {
              return pi.value;
            },
            set: function (value) {
              if (pi.value === value) return;
              pi.setValue(value);
              pi.cast({ target: pi });
            }
          });
        })(self, pi);
      }

      function setterInfo(elem) {
        var setter;
        // Switch setterFunction depending on the elemnt type
        if (isInputValue(elem)) {
          setter = function (event) {
            this.elem.value = event.target.value;
          };
        } else {
          setter = function (event) {
            this.elem.textContent = event.target.value;
          };
        }
        return {
          _rid: mergeRid(elem)._rid,
          elem: elem,
          setter: setter,
        };
      }

      function loadPropertyInfo(r, propName) {
        var pi;
        pi = r.pis[propName];
        if (!pi) {
          throw new Error("No property of '" + propName + "'");
        }
        return pi;
      }

      // transmit object property value to DOM element
      P.tx = function (propName, qryOrElems) {
        var pi = loadPropertyInfo(repos[this._rid], propName);
        if (arguments.length === 1) {
          qryOrElems = propName;
        }
        map(parseQryOrElems(qryOrElems), function (ee) {
          pi.addSetterInfo(setterInfo(ee.elem));
        });
      };

      // receive value to object property from Dom element
      P.rx = function (propName, qryOrElems) {
        var pi = loadPropertyInfo(repos[this._rid], propName);
        if (arguments.length === 1) {
          qryOrElems = propName;
        }
        map(parseQryOrElems(qryOrElems), function (ee) {
          (function (ee, pi) {
            ee.elem.addEventListener(ee.eventType, function (event) {
              pi.cast(event);
            });
          })(ee, pi);
        });
      };

      // transmit object property value to DOM element
      // receive value to object property from Dom element
      P.trx = function (propName, qryOrElems) {
        var pi = loadPropertyInfo(repos[this._rid], propName);
        if (arguments.length === 1) {
          qryOrElems = propName;
        }
        map(parseQryOrElems(qryOrElems), function (ee) {
          pi.addSetterInfo(setterInfo(ee.elem));
          (function (ee, pi) {
            ee.elem.addEventListener(ee.eventType, function (event) {
              pi.cast(event);
            });
          })(ee, pi);
        });
      };

    })(Trax.prototype);

    function deepClone(target, memories) {
      var name, v, cloneObj, cloneAry, i, len;
      memories = memories || [];
      if (isObject(target)) {
        memories.push(target);
        cloneObj = {};
        for (name in target) {
          if (!target.hasOwnProperty(name)) continue;
          v = target[name];
          if (memories.indexOf(v) > 0) continue;
          cloneObj[name] = deepClone(v, memories);
        }
        return cloneObj;
      } else if (isArray(target)) {
        memories.push(target);
        cloneAry = [];
        for (i = 0, len = target.length; i < len; ++i) {
          v = target[i];
          if (memories.indexOf(v) > 0) continue;
          cloneAry.push(deepClone(v, memories));
        }
      } else {
        return target;
      }
    }

    // arrayByDecl create an array that cat create array item 
    // consist of declearation object
    //
    // arrayByDecl is introduced to support in the case of:
    //  * You want to declare a structure of an item in array.
    //  * But in th beging of page loading, the array must be empty.
    //
    // The parameter must be an Object.
    // The Object is to represent decl for Trax.
    // The returned array will be modified to:
    //  * add _createItem method. The method create new Trax consists of the Object.
    arrayByDecl = Trax.arrayByDecl = function arrayByDecl(decl) {
      if (decl == null) throw Error("The parameter was null");
      if (!isObject(decl)) throw Error("The parameter was not an object");

      var array = [];
      array._createItem = (function (decl) {
        return function() {
          return new Trax(deepClone(decl));
        };
      })(decl);
      
      return array;
    };

    Trax.release = "0.0.9";

    return Trax;
  })();

});