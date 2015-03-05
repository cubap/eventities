angular.module("Eventities", ['ngStorage', 'ui.bootstrap'])
    .service("EntitiesService", function ($localStorage) {
        var service = this;
        var checkKnownTypes = function (type) {
            var init = {};
            while (types[type]) {
                var ext = angular.copy(types[type].defaultFields);
                if (ext.events && init.events) {
                    init.events = init.events.concat(ext.events);
                }
                init = angular.extend(ext, init);
                type = types[type]["class"];
            }
            return init;
        };
        this.new = function (init) {
            var ent = checkKnownTypes(init["@type"]);
            ent['@id'] = makeId(ent['@type']);
            $localStorage.entities[ent['@id']] = ent;
            ent.events = applyEvents(ent.events, init.participants);
            return ent;
        };
        var makeId = function (t) {
            var generator = "nv"; // Eventities
            var type = t || "unknown";
            var tail = Date.now();
            return [generator, type, tail].join("-");
        };
        var applyEvents = function (events, participants) {
            var evts = [];
            // build events based on definedTypes
            angular.forEach(events, function (ev) {
                if (types[ev]) {
                    var type = angualr.copy(ev);
                    while (types[type]) {
                        var newEvt = service.new(types[type]);



                    }
                }
            })
            return evts;
        };
        $localStorage.$default({
            entities: {},
            types: {},
            "@context": {
                config: {
                    "ENTITY": {
                        class: null,
                        "@type": "nv:Entity",
                        requires: [],
                        defaultFields: [{
                                label: "label",
                                "@id": "rdfs:label",
                                _defaultValue: null,
                                _typeOf: ["string"], // ultimately resolves to
                                _nMin: 0,
                                _nMax: Infinity,
                                _infinite: true,
                                required: true
                            }, {
                                label: "@type",
                                "@id": "rdf:type",
                                _defaultValue: "@id",
                                _typeOf: ["string", "uri"],
                                _nMin: 1,
                                _nMax: Infinity,
                                _infinite: true,
                                required: true
                            }]
                    },
                    "EVENT": {
                        class: "ENTITY",
                        "@type": "nv:Event",
                        defaultFields: [{
                                label: "outcomes",
                                "@id": "aggregates",
                                _defaultValue: [],
                                _typeOf: ["OUTCOME"],
                                _nMin: 0,
                                _nMax: Infinity,
                                _infinite: true,
                                required: true
                            }]
                    },
                    "OUTCOME": {
                        /* This is an annotation that applies a new property
                         * to an Entity and is evidenced by an Event. The
                         * target is the Entity being described and the body
                         * is the property and value to be applied.
                         * */
                        class: null,
                        "@type": "nv:Outcome", // also an "oa:Annotation", but let's catch this in the @context
                        defaultFields: [{
                                label: "hasTarget",
                                "@id": "oa:hasTarget",
                                _defaultValue: "owl:Nothing", // Specifically targetting nothing
                                _typeOf: ["ENTITY"],
                                _nMin: 1,
                                _nMax: 1, // one at a time for now, the interface can simplify it
                                required: true
                            }, {
                                label: "hasBody",
                                "@id": "oa:hasBody",
                                _defaultValue: "owl:Nothing",
                                _typeOf: ["EFFECT"], // the property and value to impose
                                _nMin: 1,
                                _nMax: 1,
                                required: true
                            }]
                    },
                    "EFFECT": {
                        class: null,
                        "@type": "@id",
                        defaultFields: [{
                                label: "property",
                                "@id": "rdf:Property",
                                _defaultValue: undefined,
                                _typeOf: ["string"],
                                _nMin: 1,
                                _nMax: 1,
                                required: true
                            }, {
                                label: "@value",
                                "@id": "rdf:value",
                                _defaultValue: null,
                                _typeOf: ["*"],
                                _noTypeRestriction: true,
                                _nMin: 0,
                                _nMax: Infinity,
                                _infinite: true,
                                required: true
                            }, {
                                label: "evidence",
                                "@id": "oa:Composite", // Things to support the assertion property:@value
                                _defaultValue: [],
                                _typeOf: ["*"],
                                _noTypeRestriction: true,
                                _nMin: 0,
                                _nMax: Infinity,
                                _infinite: true,
                                required: true
                            }]
                    }
                }
            }
        });
        this.list = $localStorage.entities;
        this.resetStorage = $localStorage.reset;
    })
    .controller("AdminController", function ($scope, $localStorage) {
        $scope.types = $localStorage.types;
        $scope.defaultObjectTypes = ["string", "number", "uri", "array"];
        $scope.addToConfig = function (config) {
            var toAdd = config;
        };
        $scope.newEnt = {
            class: "ENTITY", // init, for now
            defaultFields: []
        };
        $scope.loadClassDefaults = function () {
            var holdClass = $scope.newEnt.class;
            $scope.newEnt.defaultFields.length = 0;
            angular.extend($scope.newEnt, angular.copy($localStorage.types[$scope.newEnt.class]));
            $scope.newEnt.class = holdClass;
            $scope.newEnt.defaultFields = $scope.newEnt.defaultFields.concat(inherit($scope.newEnt));
        };
        $scope.toggleValue = function (field, value) {
            var index = field._typeOf.indexOf(value);
            if (index === -1) {
                field._typeOf.push(value);
            } else {
                field._typeOf.splice(index, 1);
            }
        };
        var inherit = function (ent) {
            var inh = [];
            if (ent) {
                var c = $localStorage.types[ent.class].class;
                while (c) {
                    var nf = $localStorage.types[c].defaultFields;
                    for (var i = 0; i < nf.length; i++) {
                        var found = false;
                        var df = ent.defaultFields;
                        for (var j = 0; j < df.length; j++) {
                            if (nf[i].label === df[j].label) {
                                found = true;
                                break;
                            }
                        }
                        for (var j = 0; j < inh.length; j++) {
                            if (nf[i].label === inh[j].label) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            inh.push(nf[i]);
                        }
                    }
                    c = $localStorage.types[c].class;
                }
            }
            return inh;
        };
    })
    .controller("MainController", function ($scope, $localStorage, EntitiesService) {
        $scope.editEnt = {};
        $scope.editProp = {};
        $scope.entities = EntitiesService.list;
        var resetForm = function (event) {
            if (event) {
                var t = event.target;
                var breakout = 0;
                while (t.tagName !== "FORM" || breakout++ > 10) {
                    t = event.target.parentElement;
                }
                t.firstElementChild.focus();
            }
            $scope.editProp = {};
        };
        $scope.new = EntitiesService.new;
        $scope.edit = function (ent) {
            $scope.editEnt = ent;
        };
        $scope.editing = function (k, v) {
            $scope.editProp = {
                key: k,
                val: v
            };
        };
        $scope.addProp = function (key, val, event) {
            $scope.editEnt[key] = val;
            resetForm(event);
        };
        $scope.delete = function (key, event) {
            delete $scope.editEnt[key];
            resetForm(event);
        };
        $scope.destroy = function (id) {
            delete EntitiesService.list[id];
        };
        $scope.hasProps = function (obj) {
            return Object.getOwnPropertyNames(obj).length;
        };
        $scope.ofClass = function (c) {
            var list = [];
            if (!c) {
                c = null;
            }
            angular.forEach($localStorage.types, function (type, key) {
                if (type.class === c) {
                    list.push(key);
                }
            });
            return list;
        };
        $scope.initializeTypes = (function () {
            angular.forEach($localStorage["@context"].config, function (cfg, key) {
                var newType = {
                    class: cfg.class,
                    "@type": cfg["@type"],
                    defaultFields: cfg.defaultFields
                };
                var newContext = {
                    "@id": cfg["@type"],
                    label: key
                };
//                angular.forEach(cfg.defaultFields, function (field) {
//                    newType[field.label] = field._defaultValue;
//                    newType.rules[field.label] = {
//                        _typeOf: field._typeOf,
//                        _nMin: field._nMin,
//                        _nMax: field._nMax
//                    };
//                });
                $localStorage.types[key] = newType;
                $localStorage["@context"].json = newContext;
            });
        })();
    });

