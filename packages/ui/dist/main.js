// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

var P, d, V, C, O, N = {}, z = [], te = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function k(e, t) {
    for(var _ in t)e[_] = t[_];
    return e;
}
function G(e) {
    var t = e.parentNode;
    t && t.removeChild(e);
}
function _e(e, t, _) {
    var r, l, o, s = {};
    for(o in t)o == "key" ? r = t[o] : o == "ref" ? l = t[o] : s[o] = t[o];
    if (arguments.length > 2 && (s.children = arguments.length > 3 ? P.call(arguments, 2) : _), typeof e == "function" && e.defaultProps != null) for(o in e.defaultProps)s[o] === void 0 && (s[o] = e.defaultProps[o]);
    return S(e, s, r, l, null);
}
function S(e, t, _, r, l) {
    var o = {
        type: e,
        props: t,
        key: _,
        ref: r,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __d: void 0,
        __c: null,
        __h: null,
        constructor: void 0,
        __v: l ?? ++V
    };
    return l == null && d.vnode != null && d.vnode(o), o;
}
function W(e) {
    return e.children;
}
function D(e, t) {
    this.props = e, this.context = t;
}
function w(e, t) {
    if (t == null) return e.__ ? w(e.__, e.__.__k.indexOf(e) + 1) : null;
    for(var _; t < e.__k.length; t++)if ((_ = e.__k[t]) != null && _.__e != null) return _.__e;
    return typeof e.type == "function" ? w(e) : null;
}
function q(e) {
    var t, _;
    if ((e = e.__) != null && e.__c != null) {
        for(e.__e = e.__c.base = null, t = 0; t < e.__k.length; t++)if ((_ = e.__k[t]) != null && _.__e != null) {
            e.__e = e.__c.base = _.__e;
            break;
        }
        return q(e);
    }
}
function H(e) {
    (!e.__d && (e.__d = !0) && C.push(e) && !L.__r++ || O !== d.debounceRendering) && ((O = d.debounceRendering) || setTimeout)(L);
}
function L() {
    for(var e; L.__r = C.length;)e = C.sort(function(t, _) {
        return t.__v.__b - _.__v.__b;
    }), C = [], e.some(function(t) {
        var _, r, l, o, s, f;
        t.__d && (s = (o = (_ = t).__v).__e, (f = _.__P) && (r = [], (l = k({}, o)).__v = o.__v + 1, F(f, o, l, _.__n, f.ownerSVGElement !== void 0, o.__h != null ? [
            s
        ] : null, r, s ?? w(o), o.__h), X(r, o), o.__e != s && q(o)));
    });
}
function J(e, t, _, r, l, o, s, f, p, a) {
    var n, h, u, i, c, b, v, y = r && r.__k || z, g = y.length;
    for(_.__k = [], n = 0; n < t.length; n++)if ((i = _.__k[n] = (i = t[n]) == null || typeof i == "boolean" ? null : typeof i == "string" || typeof i == "number" || typeof i == "bigint" ? S(null, i, null, null, i) : Array.isArray(i) ? S(W, {
        children: i
    }, null, null, null) : i.__b > 0 ? S(i.type, i.props, i.key, i.ref ? i.ref : null, i.__v) : i) != null) {
        if (i.__ = _, i.__b = _.__b + 1, (u = y[n]) === null || u && i.key == u.key && i.type === u.type) y[n] = void 0;
        else for(h = 0; h < g; h++){
            if ((u = y[h]) && i.key == u.key && i.type === u.type) {
                y[h] = void 0;
                break;
            }
            u = null;
        }
        F(e, i, u = u || N, l, o, s, f, p, a), c = i.__e, (h = i.ref) && u.ref != h && (v || (v = []), u.ref && v.push(u.ref, null, i), v.push(h, i.__c || c, i)), c != null ? (b == null && (b = c), typeof i.type == "function" && i.__k === u.__k ? i.__d = p = K(i, p, e) : p = Q(e, i, u, y, c, p), typeof _.type == "function" && (_.__d = p)) : p && u.__e == p && p.parentNode != e && (p = w(u));
    }
    for(_.__e = b, n = g; n--;)y[n] != null && Z(y[n], y[n]);
    if (v) for(n = 0; n < v.length; n++)Y(v[n], v[++n], v[++n]);
}
function K(e, t, _) {
    for(var r, l = e.__k, o = 0; l && o < l.length; o++)(r = l[o]) && (r.__ = e, t = typeof r.type == "function" ? K(r, t, _) : Q(_, r, r, l, r.__e, t));
    return t;
}
function Q(e, t, _, r, l, o) {
    var s, f, p;
    if (t.__d !== void 0) s = t.__d, t.__d = void 0;
    else if (_ == null || l != o || l.parentNode == null) e: if (o == null || o.parentNode !== e) e.appendChild(l), s = null;
    else {
        for(f = o, p = 0; (f = f.nextSibling) && p < r.length; p += 1)if (f == l) break e;
        e.insertBefore(l, o), s = o;
    }
    return s !== void 0 ? s : l.nextSibling;
}
function oe(e, t, _, r, l) {
    var o;
    for(o in _)o === "children" || o === "key" || o in t || M(e, o, null, _[o], r);
    for(o in t)l && typeof t[o] != "function" || o === "children" || o === "key" || o === "value" || o === "checked" || _[o] === t[o] || M(e, o, t[o], _[o], r);
}
function R(e, t, _) {
    t[0] === "-" ? e.setProperty(t, _) : e[t] = _ == null ? "" : typeof _ != "number" || te.test(t) ? _ : _ + "px";
}
function M(e, t, _, r, l) {
    var o;
    e: if (t === "style") if (typeof _ == "string") e.style.cssText = _;
    else {
        if (typeof r == "string" && (e.style.cssText = r = ""), r) for(t in r)_ && t in _ || R(e.style, t, "");
        if (_) for(t in _)r && _[t] === r[t] || R(e.style, t, _[t]);
    }
    else if (t[0] === "o" && t[1] === "n") o = t !== (t = t.replace(/Capture$/, "")), t = t.toLowerCase() in e ? t.toLowerCase().slice(2) : t.slice(2), e.l || (e.l = {}), e.l[t + o] = _, _ ? r || e.addEventListener(t, o ? B : $, o) : e.removeEventListener(t, o ? B : $, o);
    else if (t !== "dangerouslySetInnerHTML") {
        if (l) t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if (t !== "href" && t !== "list" && t !== "form" && t !== "tabIndex" && t !== "download" && t in e) try {
            e[t] = _ ?? "";
            break e;
        } catch  {}
        typeof _ == "function" || (_ == null || _ === !1 && t.indexOf("-") == -1 ? e.removeAttribute(t) : e.setAttribute(t, _));
    }
}
function $(e) {
    this.l[e.type + !1](d.event ? d.event(e) : e);
}
function B(e) {
    this.l[e.type + !0](d.event ? d.event(e) : e);
}
function F(e, t, _, r, l, o, s, f, p) {
    var a, n, h, u, i, c, b, v, y, g, E, x, I, A, T, m = t.type;
    if (t.constructor !== void 0) return null;
    _.__h != null && (p = _.__h, f = t.__e = _.__e, t.__h = null, o = [
        f
    ]), (a = d.__b) && a(t);
    try {
        e: if (typeof m == "function") {
            if (v = t.props, y = (a = m.contextType) && r[a.__c], g = a ? y ? y.props.value : a.__ : r, _.__c ? b = (n = t.__c = _.__c).__ = n.__E : ("prototype" in m && m.prototype.render ? t.__c = n = new m(v, g) : (t.__c = n = new D(v, g), n.constructor = m, n.render = le), y && y.sub(n), n.props = v, n.state || (n.state = {}), n.context = g, n.__n = r, h = n.__d = !0, n.__h = [], n._sb = []), n.__s == null && (n.__s = n.state), m.getDerivedStateFromProps != null && (n.__s == n.state && (n.__s = k({}, n.__s)), k(n.__s, m.getDerivedStateFromProps(v, n.__s))), u = n.props, i = n.state, h) m.getDerivedStateFromProps == null && n.componentWillMount != null && n.componentWillMount(), n.componentDidMount != null && n.__h.push(n.componentDidMount);
            else {
                if (m.getDerivedStateFromProps == null && v !== u && n.componentWillReceiveProps != null && n.componentWillReceiveProps(v, g), !n.__e && n.shouldComponentUpdate != null && n.shouldComponentUpdate(v, n.__s, g) === !1 || t.__v === _.__v) {
                    for(n.props = v, n.state = n.__s, t.__v !== _.__v && (n.__d = !1), n.__v = t, t.__e = _.__e, t.__k = _.__k, t.__k.forEach(function(U) {
                        U && (U.__ = t);
                    }), E = 0; E < n._sb.length; E++)n.__h.push(n._sb[E]);
                    n._sb = [], n.__h.length && s.push(n);
                    break e;
                }
                n.componentWillUpdate != null && n.componentWillUpdate(v, n.__s, g), n.componentDidUpdate != null && n.__h.push(function() {
                    n.componentDidUpdate(u, i, c);
                });
            }
            if (n.context = g, n.props = v, n.__v = t, n.__P = e, x = d.__r, I = 0, "prototype" in m && m.prototype.render) {
                for(n.state = n.__s, n.__d = !1, x && x(t), a = n.render(n.props, n.state, n.context), A = 0; A < n._sb.length; A++)n.__h.push(n._sb[A]);
                n._sb = [];
            } else do n.__d = !1, x && x(t), a = n.render(n.props, n.state, n.context), n.state = n.__s;
            while (n.__d && ++I < 25)
            n.state = n.__s, n.getChildContext != null && (r = k(k({}, r), n.getChildContext())), h || n.getSnapshotBeforeUpdate == null || (c = n.getSnapshotBeforeUpdate(u, i)), T = a != null && a.type === W && a.key == null ? a.props.children : a, J(e, Array.isArray(T) ? T : [
                T
            ], t, _, r, l, o, s, f, p), n.base = t.__e, t.__h = null, n.__h.length && s.push(n), b && (n.__E = n.__ = null), n.__e = !1;
        } else o == null && t.__v === _.__v ? (t.__k = _.__k, t.__e = _.__e) : t.__e = re(_.__e, t, _, r, l, o, s, p);
        (a = d.diffed) && a(t);
    } catch (U) {
        t.__v = null, (p || o != null) && (t.__e = f, t.__h = !!p, o[o.indexOf(f)] = null), d.__e(U, t, _);
    }
}
function X(e, t) {
    d.__c && d.__c(t, e), e.some(function(_) {
        try {
            e = _.__h, _.__h = [], e.some(function(r) {
                r.call(_);
            });
        } catch (r) {
            d.__e(r, _.__v);
        }
    });
}
function re(e, t, _, r, l, o, s, f) {
    var p, a, n, h = _.props, u = t.props, i = t.type, c = 0;
    if (i === "svg" && (l = !0), o != null) {
        for(; c < o.length; c++)if ((p = o[c]) && "setAttribute" in p == !!i && (i ? p.localName === i : p.nodeType === 3)) {
            e = p, o[c] = null;
            break;
        }
    }
    if (e == null) {
        if (i === null) return document.createTextNode(u);
        e = l ? document.createElementNS("http://www.w3.org/2000/svg", i) : document.createElement(i, u.is && u), o = null, f = !1;
    }
    if (i === null) h === u || f && e.data === u || (e.data = u);
    else {
        if (o = o && P.call(e.childNodes), a = (h = _.props || N).dangerouslySetInnerHTML, n = u.dangerouslySetInnerHTML, !f) {
            if (o != null) for(h = {}, c = 0; c < e.attributes.length; c++)h[e.attributes[c].name] = e.attributes[c].value;
            (n || a) && (n && (a && n.__html == a.__html || n.__html === e.innerHTML) || (e.innerHTML = n && n.__html || ""));
        }
        if (oe(e, u, h, l, f), n) t.__k = [];
        else if (c = t.props.children, J(e, Array.isArray(c) ? c : [
            c
        ], t, _, r, l && i !== "foreignObject", o, s, o ? o[0] : _.__k && w(_, 0), f), o != null) for(c = o.length; c--;)o[c] != null && G(o[c]);
        f || ("value" in u && (c = u.value) !== void 0 && (c !== e.value || i === "progress" && !c || i === "option" && c !== h.value) && M(e, "value", c, h.value, !1), "checked" in u && (c = u.checked) !== void 0 && c !== e.checked && M(e, "checked", c, h.checked, !1));
    }
    return e;
}
function Y(e, t, _) {
    try {
        typeof e == "function" ? e(t) : e.current = t;
    } catch (r) {
        d.__e(r, _);
    }
}
function Z(e, t, _) {
    var r, l;
    if (d.unmount && d.unmount(e), (r = e.ref) && (r.current && r.current !== e.__e || Y(r, null, t)), (r = e.__c) != null) {
        if (r.componentWillUnmount) try {
            r.componentWillUnmount();
        } catch (o) {
            d.__e(o, t);
        }
        r.base = r.__P = null, e.__c = void 0;
    }
    if (r = e.__k) for(l = 0; l < r.length; l++)r[l] && Z(r[l], t, _ || typeof e.type != "function");
    _ || e.__e == null || G(e.__e), e.__ = e.__e = e.__d = void 0;
}
function le(e, t, _) {
    return this.constructor(e, _);
}
function ie(e, t, _) {
    var r, l, o;
    d.__ && d.__(e, t), l = (r = typeof _ == "function") ? null : _ && _.__k || t.__k, o = [], F(t, e = (!r && _ || t).__k = _e(W, null, [
        e
    ]), l || N, N, t.ownerSVGElement !== void 0, !r && _ ? [
        _
    ] : l ? null : t.firstChild ? P.call(t.childNodes) : null, o, !r && _ ? _ : l ? l.__e : t.firstChild, r), X(o, e);
}
P = z.slice, d = {
    __e: function(e, t, _, r) {
        for(var l, o, s; t = t.__;)if ((l = t.__c) && !l.__) try {
            if ((o = l.constructor) && o.getDerivedStateFromError != null && (l.setState(o.getDerivedStateFromError(e)), s = l.__d), l.componentDidCatch != null && (l.componentDidCatch(e, r || {}), s = l.__d), s) return l.__E = l;
        } catch (f) {
            e = f;
        }
        throw e;
    }
}, V = 0, D.prototype.setState = function(e, t) {
    var _;
    _ = this.__s != null && this.__s !== this.state ? this.__s : this.__s = k({}, this.state), typeof e == "function" && (e = e(k({}, _), this.props)), e && k(_, e), e != null && this.__v && (t && this._sb.push(t), H(this));
}, D.prototype.forceUpdate = function(e) {
    this.__v && (this.__e = !0, e && this.__h.push(e), H(this));
}, D.prototype.render = W, C = [], L.__r = 0, 0;
var i, o, d1, N1, f = 0, q1 = [], l = [], V1 = d.__b, b = d.__r, g = d.diffed, A = d.__c, C1 = d.unmount;
function a(_, n) {
    d.__h && d.__h(o, _, f || n), f = 0;
    var u = o.__H || (o.__H = {
        __: [],
        __h: []
    });
    return _ >= u.__.length && u.__.push({
        __V: l
    }), u.__[_];
}
function P1(_) {
    return f = 1, k1(x, _);
}
function k1(_, n, u) {
    var t = a(i++, 2);
    if (t.t = _, !t.__c && (t.__ = [
        u ? u(n) : x(void 0, n),
        function(s) {
            var h = t.__N ? t.__N[0] : t.__[0], v = t.t(h, s);
            h !== v && (t.__N = [
                v,
                t.__[1]
            ], t.__c.setState({}));
        }
    ], t.__c = o, !o.u)) {
        o.u = !0;
        var e = o.shouldComponentUpdate;
        o.shouldComponentUpdate = function(s, h, v) {
            if (!t.__c.__H) return !0;
            var E = t.__c.__H.__.filter(function(c) {
                return c.__c;
            });
            if (E.every(function(c) {
                return !c.__N;
            })) return !e || e.call(this, s, h, v);
            var y = !1;
            return E.forEach(function(c) {
                if (c.__N) {
                    var T = c.__[0];
                    c.__ = c.__N, c.__N = void 0, T !== c.__[0] && (y = !0);
                }
            }), !(!y && t.__c.props === s) && (!e || e.call(this, s, h, v));
        };
    }
    return t.__N || t.__;
}
function U(_, n) {
    var u = a(i++, 3);
    !d.__s && H1(u.__H, n) && (u.__ = _, u.i = n, o.__H.__h.push(u));
}
function j(_) {
    return f = 5, D1(function() {
        return {
            current: _
        };
    }, []);
}
function D1(_, n) {
    var u = a(i++, 7);
    return H1(u.__H, n) ? (u.__V = _(), u.i = n, u.__h = _, u.__V) : u.__;
}
function I() {
    for(var _; _ = q1.shift();)if (_.__P && _.__H) try {
        _.__H.__h.forEach(m), _.__H.__h.forEach(p), _.__H.__h = [];
    } catch (n) {
        _.__H.__h = [], d.__e(n, _.__v);
    }
}
d.__b = function(_) {
    o = null, V1 && V1(_);
}, d.__r = function(_) {
    b && b(_), i = 0;
    var n = (o = _.__c).__H;
    n && (d1 === o ? (n.__h = [], o.__h = [], n.__.forEach(function(u) {
        u.__N && (u.__ = u.__N), u.__V = l, u.__N = u.i = void 0;
    })) : (n.__h.forEach(m), n.__h.forEach(p), n.__h = [])), d1 = o;
}, d.diffed = function(_) {
    g && g(_);
    var n = _.__c;
    n && n.__H && (n.__H.__h.length && (q1.push(n) !== 1 && N1 === d.requestAnimationFrame || ((N1 = d.requestAnimationFrame) || R1)(I)), n.__H.__.forEach(function(u) {
        u.i && (u.__H = u.i), u.__V !== l && (u.__ = u.__V), u.i = void 0, u.__V = l;
    })), d1 = o = null;
}, d.__c = function(_, n) {
    n.some(function(u) {
        try {
            u.__h.forEach(m), u.__h = u.__h.filter(function(t) {
                return !t.__ || p(t);
            });
        } catch (t) {
            n.some(function(e) {
                e.__h && (e.__h = []);
            }), n = [], d.__e(t, u.__v);
        }
    }), A && A(_, n);
}, d.unmount = function(_) {
    C1 && C1(_);
    var n, u = _.__c;
    u && u.__H && (u.__H.__.forEach(function(t) {
        try {
            m(t);
        } catch (e) {
            n = e;
        }
    }), u.__H = void 0, n && d.__e(n, u.__v));
};
var F1 = typeof requestAnimationFrame == "function";
function R1(_) {
    var n, u = function() {
        clearTimeout(t), F1 && cancelAnimationFrame(n), setTimeout(_);
    }, t = setTimeout(u, 100);
    F1 && (n = requestAnimationFrame(u));
}
function m(_) {
    var n = o, u = _.__c;
    typeof u == "function" && (_.__c = void 0, u()), o = n;
}
function p(_) {
    var n = o;
    _.__c = _.__(), o = n;
}
function H1(_, n) {
    return !_ || _.length !== n.length || n.some(function(u, t) {
        return u !== _[t];
    });
}
function x(_, n) {
    return typeof n == "function" ? n(_) : n;
}
var h = Object.create;
var s = Object.defineProperty;
var x1 = Object.getOwnPropertyDescriptor;
var c = Object.getOwnPropertyNames;
var k2 = Object.getPrototypeOf, I1 = Object.prototype.hasOwnProperty;
var O1 = (i, r)=>()=>(r || i((r = {
            exports: {}
        }).exports, r), r.exports);
var q2 = (i, r, n, f)=>{
    if (r && typeof r == "object" || typeof r == "function") for (let v of c(r))!I1.call(i, v) && v !== n && s(i, v, {
        get: ()=>r[v],
        enumerable: !(f = x1(r, v)) || f.enumerable
    });
    return i;
};
var w1 = (i, r, n)=>(n = i != null ? h(k2(i)) : {}, q2(r || !i || !i.__esModule ? s(n, "default", {
        value: i,
        enumerable: !0
    }) : n, i));
var t = O1((D, m)=>{
    var e = {
        a: [
            "\u0101",
            "\xE1",
            "\u01CE",
            "\xE0"
        ],
        e: [
            "\u0113",
            "\xE9",
            "\u011B",
            "\xE8"
        ],
        u: [
            "\u016B",
            "\xFA",
            "\u01D4",
            "\xF9"
        ],
        i: [
            "\u012B",
            "\xED",
            "\u01D0",
            "\xEC"
        ],
        o: [
            "\u014D",
            "\xF3",
            "\u01D2",
            "\xF2"
        ],
        ü: [
            "\u01D6",
            "\u01D8",
            "\u01DA",
            "\u01DC"
        ]
    }, z = [
        "i",
        "u",
        "\xFC"
    ], A = function(i) {
        i = i.replace("v", "\xFC");
        for(var r = i.split(" "), n = 0; n < r.length; n++){
            var f = r[n], v = parseInt(f[f.length - 1]);
            if (v <= 0 || v > 5) console.error("invalid tone number:", v, "in", f);
            else if (v === 5) r[n] = f.slice(0, f.length - 1);
            else for(var a = 0; a < f.length; a++){
                var u = f[a], p = f[a + 1];
                if (e[u]) {
                    var d, o;
                    e[p] && z.indexOf(u) >= 0 ? o = p : o = u, d = f.replace(o, e[o][v - 1]), r[n] = d.slice(0, d.length - 1);
                    break;
                }
            }
        }
        return r.join(" ");
    };
    m.exports.prettify = A;
});
var g1 = w1(t()), { prettify: E  } = g1, { default: _ , ...B1 } = g1;
function createToken(value, offset, line, column, hasEntries) {
    return {
        value,
        offset,
        line,
        column,
        hasEntries
    };
}
function createEntry(traditional, simplified, pinyin, english) {
    return {
        traditional,
        simplified,
        pinyin,
        english
    };
}
const importMeta = {
    url: "file:///F:/Projects/zilin/packages/tokenizer/pkg/chinese_tokenizer.js",
    main: false
};
let wasm;
const cachedTextDecoder = new TextDecoder('utf-8', {
    ignoreBOM: true,
    fatal: true
});
cachedTextDecoder.decode();
let cachedUint8Memory0 = new Uint8Array();
function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}
function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
const heap = new Array(32).fill(undefined);
heap.push(undefined, null, true, false);
let heap_next = heap.length;
function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];
    heap[idx] = obj;
    return idx;
}
let WASM_VECTOR_LEN = 0;
const cachedTextEncoder = new TextEncoder('utf-8');
const encodeString = typeof cachedTextEncoder.encodeInto === 'function' ? function(arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
} : function(arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
};
function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }
    let len = arg.length;
    let ptr1 = malloc(len);
    const mem = getUint8Memory0();
    let offset = 0;
    for(; offset < len; offset++){
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr1 + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr1 = realloc(ptr1, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr1 + offset, ptr1 + len);
        const ret = encodeString(arg, view);
        offset += ret.written;
    }
    WASM_VECTOR_LEN = offset;
    return ptr1;
}
let cachedInt32Memory0 = new Int32Array();
function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}
let cachedUint32Memory0 = new Uint32Array();
function getUint32Memory0() {
    if (cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}
function getObject(idx) {
    return heap[idx];
}
function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}
function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}
function getArrayJsValueFromWasm0(ptr, len) {
    const mem = getUint32Memory0();
    const slice = mem.subarray(ptr / 4, ptr / 4 + len);
    const result = [];
    for(let i = 0; i < slice.length; i++){
        result.push(takeObject(slice[i]));
    }
    return result;
}
function tokenize(input) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.tokenize(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4);
        return v1;
    } finally{
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
function lookupSimplified(word) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(word, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.lookupSimplified(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4);
        return v1;
    } finally{
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
function lookupTraditional(word) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(word, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.lookupTraditional(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4);
        return v1;
    } finally{
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}
function _main() {
    wasm._main();
}
async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
                } else {
                    throw e;
                }
            }
        }
        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);
        if (instance instanceof WebAssembly.Instance) {
            return {
                instance,
                module
            };
        } else {
            return instance;
        }
    }
}
function getImports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_createToken_b1ea6f25cb84ffe7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = createToken(getStringFromWasm0(arg0, arg1), arg2 >>> 0, arg3 >>> 0, arg4 >>> 0, arg5 !== 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_createEntry_7d6ce0bc1212f5dc = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = createEntry(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7));
        return addHeapObject(ret);
    };
    return imports;
}
function initMemory(imports, maybe_memory) {}
function finalizeInit(instance, module) {
    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    cachedInt32Memory0 = new Int32Array();
    cachedUint32Memory0 = new Uint32Array();
    cachedUint8Memory0 = new Uint8Array();
    wasm.__wbindgen_start();
    return wasm;
}
function initSync(module) {
    const imports = getImports();
    initMemory(imports);
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return finalizeInit(instance, module);
}
async function init(input) {
    if (typeof input === 'undefined') {
        input = new URL('chinese_tokenizer_bg.wasm', importMeta.url);
    }
    const imports = getImports();
    if (typeof input === 'string' || typeof Request === 'function' && input instanceof Request || typeof URL === 'function' && input instanceof URL) {
        input = fetch(input);
    }
    initMemory(imports);
    const { instance , module  } = await load(await input, imports);
    return finalizeInit(instance, module);
}
const mod = {
    initSync: initSync,
    tokenize: tokenize,
    lookupSimplified: lookupSimplified,
    lookupTraditional: lookupTraditional,
    _main: _main,
    default: init
};
const loadedMap = new WeakMap();
async function loadTokenizer() {
    if (!loadedMap.get(mod)) {
        await mod.default("./packages/tokenizer/pkg/chinese_tokenizer_bg.wasm");
        loadedMap.set(mod, true);
    }
    return mod;
}
function useAsync(fn, deps) {
    const promRef = j(null);
    const [state, setState] = P1({
        fulfilled: false
    });
    U(()=>{
        const prom = fn();
        promRef.current = prom;
        setState((state)=>({
                fulfilled: false,
                previousValue: state.value
            }));
        prom.then((value)=>({
                value
            })).catch((err)=>({
                err
            })).then((update)=>{
            if (promRef.current !== prom) return;
            setState((state)=>({
                    ...state,
                    previousValue: state.value,
                    fulfilled: true,
                    ...update
                }));
        });
    }, deps);
    return state;
}
function useResizeObserver(elementRef) {
    const [size, setSize] = P1();
    U(function updateSize() {
        const element = elementRef.current;
        if (element == null) return;
        let lastUpdateTimestamp = Date.now();
        setSize({
            width: element.offsetWidth,
            height: element.offsetHeight
        });
        const observer = new ResizeObserver((entries)=>{
            if (Date.now() - lastUpdateTimestamp > 30 && entries.find((entry)=>entry.target === element) != null) {
                setSize({
                    width: element.offsetWidth,
                    height: element.offsetHeight
                });
                lastUpdateTimestamp = Date.now();
            }
        });
        observer.observe(element);
        return ()=>observer.disconnect();
    }, [
        elementRef.current
    ]);
    return size;
}
const TokenTextarea = (props)=>{
    const containerRef = j(null);
    const tokensContainerRef = j(null);
    const contentSize = useResizeObserver(tokensContainerRef);
    const [tokenRects, setTokenRects] = P1();
    U(function updateTokenRects() {
        const container = containerRef.current;
        const tokensContainer = tokensContainerRef.current;
        if (contentSize == null || container == null || tokensContainer == null) return;
        setTokenRects([
            ...tokensContainer.querySelectorAll(".token")
        ].map((el)=>[
                ...el.getClientRects()
            ].map((rect)=>({
                    left: rect.left + container.scrollLeft - container.offsetLeft,
                    top: rect.top + container.scrollTop - container.offsetTop,
                    width: Math.max(rect.width, 1),
                    height: rect.height
                }))));
    }, [
        contentSize,
        props.tokens
    ]);
    const tokens = props.loading ? [
        {
            value: props.value
        }
    ] : props.tokens ?? [];
    return _e("div", {
        ref: containerRef,
        class: "token-textarea " + (props.loading ? "loading " : "")
    }, _e("div", {
        ref: tokensContainerRef,
        class: "tokens"
    }, tokens?.map((token, i)=>_e("span", {
            class: "token"
        }, i === tokens.length - 1 && token.value[token.value.length - 1] === "\n" ? token.value + " " : token.value))), contentSize != null && _e("textarea", {
        style: {
            ...contentSize
        },
        autofocus: true,
        value: props.value,
        onInput: props.onInput
    }), contentSize != null && _e("div", {
        class: "overlay",
        style: {
            ...contentSize
        }
    }, tokenRects?.map((rects, i)=>{
        const token = tokens[i];
        if (token == null) return;
        const wordRect = {
            left: rects[0]?.left,
            top: rects[0]?.top,
            height: rects[0]?.height,
            width: rects.filter((rect)=>rect.top === rects[0]?.top).map((rect)=>rect.width).reduce((sum, x)=>sum + x, 0)
        };
        return _e("div", {
            class: "word " + (props.highlight === token.value ? "highlight " : ""),
            style: {
                position: "absolute",
                ...wordRect
            }
        }, rects.map((rect)=>_e("span", {
                class: "box",
                style: {
                    position: "absolute",
                    left: rect.left - wordRect.left,
                    top: rect.top - wordRect.top,
                    width: rect.width,
                    height: rect.height
                }
            }, !token.unselectable && _e("a", {
                href: "#" + token.value
            }))), props.highlight === token.value && _e("span", {
            class: "pronunciation"
        }, token.pronunciation?.()));
    })));
};
const DictionaryPane = (props)=>{
    return _e("section", {
        class: "dictionary-pane"
    }, _e("div", {
        class: "word-info"
    }, _e("h1", {
        class: "word " + ((props.word?.length ?? 0) >= 4 ? "small " : "")
    }, props.word), _e("ul", {
        class: "variants"
    }, props.variants?.map((variant)=>_e("li", null, _e("a", {
            href: "#" + variant
        }, variant)))), _e("ul", {
        class: "meanings"
    }, props.meanings?.map((entry)=>_e("li", null, _e("span", {
            class: "pinyin"
        }, entry.pinyin), " ", _e("span", {
            class: "explanation"
        }, entry.explanation))))));
};
const ModeSwitcher = (props)=>{
    return _e("div", {
        class: "mode-switcher"
    }, _e("ul", null, _e("li", {
        class: props.mode === "simplified" ? "current" : ""
    }, _e("a", {
        href: "#",
        onClick: (evt)=>{
            evt.preventDefault();
            props.onChange?.({
                mode: "simplified"
            });
        }
    }, "Simplified")), _e("li", {
        class: props.mode === "traditional" ? "current" : ""
    }, _e("a", {
        href: "#",
        onClick: (evt)=>{
            evt.preventDefault();
            props.onChange?.({
                mode: "traditional"
            });
        }
    }, "Traditional"))));
};
function prettifyPinyin(pinyin) {
    return E(pinyin.replaceAll("u:", "ü"));
}
const App = ()=>{
    const tokenizer = useAsync(async ()=>{
        return await loadTokenizer();
    }, []);
    const [mode, setMode] = P1("simplified");
    const [input, setInput] = P1("");
    const [highlight, setHighlight] = P1();
    const tokens = D1(()=>{
        if (tokenizer.value != null) {
            return tokenizer.value.tokenize(input);
        }
    }, [
        tokenizer.value,
        input
    ]);
    const lookup = (word, mode)=>mode === "simplified" ? tokenizer.value?.lookupSimplified(word) : tokenizer.value?.lookupTraditional(word);
    const tokenTokenizerTokens = D1(()=>tokens?.map((token)=>({
                value: token.value,
                pronunciation: ()=>{
                    const entries = [
                        ...tokenizer.value?.lookupSimplified(token.value) ?? [],
                        ...tokenizer.value?.lookupTraditional(token.value) ?? []
                    ];
                    return [
                        ...new Set(entries.map((entry)=>entry.pinyin))
                    ].sort().map((pinyin)=>prettifyPinyin(pinyin)).join("/");
                },
                unselectable: token.value.trim() === "" || !token.hasEntries
            })), [
        tokens
    ]);
    const dictionaryEntries = D1(()=>{
        if (highlight != null && tokenizer.fulfilled) {
            return lookup(highlight, mode) ?? [];
        }
        return [];
    }, [
        mode,
        tokenizer.fulfilled,
        highlight
    ]);
    const wordVariants = D1(()=>{
        const set = new Set(dictionaryEntries.flatMap((entry)=>[
                entry.simplified,
                entry.traditional
            ]));
        set.delete(highlight);
        return [
            ...set
        ].sort();
    }, [
        dictionaryEntries,
        highlight
    ]);
    U(function switchMode() {
        if (tokenizer.value != null && highlight != null && dictionaryEntries.length === 0) {
            const otherMode = mode === "simplified" ? "traditional" : "simplified";
            if (lookup(highlight, otherMode).length > 0) {
                setMode(otherMode);
            }
        }
    }, [
        tokenizer.value,
        dictionaryEntries
    ]);
    U(function handleHistory() {
        const handlePopState = (evt)=>{
            evt?.preventDefault();
            const word = decodeURIComponent(document.location.hash.slice(1));
            setHighlight(word);
        };
        handlePopState();
        globalThis.addEventListener("popstate", handlePopState);
        return ()=>globalThis.removeEventListener("popstate", handlePopState);
    }, []);
    return _e("div", {
        class: "app"
    }, _e(TokenTextarea, {
        value: input,
        loading: !tokenizer.fulfilled,
        tokens: tokenTokenizerTokens,
        highlight: highlight,
        onInput: (evt)=>setInput(evt.currentTarget.value)
    }), _e("aside", null, _e(ModeSwitcher, {
        mode: mode,
        onChange: (evt)=>{
            const needHighlightChange = !dictionaryEntries.some((entry)=>entry[evt.mode] === highlight);
            if (needHighlightChange) {
                const newHighlight = dictionaryEntries[0]?.[evt.mode];
                globalThis.location.href = "#" + newHighlight;
            }
            setMode(evt.mode);
        }
    }), _e(DictionaryPane, {
        word: dictionaryEntries.length > 0 ? highlight : undefined,
        variants: wordVariants,
        meanings: dictionaryEntries.map((entry)=>({
                pinyin: prettifyPinyin(entry.pinyin),
                explanation: entry.english.replaceAll("/", " / ").replaceAll("|", " | ").replaceAll(",", ", ").replaceAll(":", ": ").replace(/\[([^\]]*)\]/g, (_, pinyin)=>` [${prettifyPinyin(pinyin)}]`)
            }))
    })));
};
ie(_e(App, null), document.getElementById("root"));
