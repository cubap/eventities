angular.module("Eventities", ['ngStorage'])
    .value("definedTypes", {
        "ROOT": {
            class: null,
            requiredFields: ["label", "@id", "@type"],
            defaultFields: {
                label: "unlabelled",
                "@id": "new",
                "@type": "nv",
                outcomes: [],
                events: []
            }
        },
        "ENTITY": {
            class: "ROOT",
            requiredFields: ["events"],
            defaultFields: {
                label: "new Entity",
                "@type": "entity",
                "events": ["DIGITALMINTINGDATE"]
            }
        },
        "EVENT": {
            class: "ROOT",
            requiredFields: ["outcomes"],
            defaultFields: {
                label: "new Event",
                "@type": "event"
            }
        },
        "PERSON": {
            class: "ENTITY",
            defaultFields: {
                label: "unnamed",
                "@type": "person",
                events: ["BIRTH"]
            },
            suggestedEvents: ["WEDDING", "RELOCATION", "DEATH", "BAPTISM"]
        },
        "BIRTH": {
            class: "EVENT",
            defaultFields: {
                label: "birth",
                "@type": "nv:birth",
                date: "",
                location: "",
                outcomes: [{
                        "rdf:describes": "+0", // argument index effected, create new if missing
                        "foaf:dateOfBirth": "date|self", // property conferred from this event
                        "hasMother": 1, // argument index effected, undefined if missing
                        "hasFather": 2, // argument index effected
                        "foaf:givenName": "",
                        "foaf:familyName": "foaf:familyName|2" // in this case, take the father's name
                    }, {
                        "rdf:describes": 1,
                        "motherTo": 0
                    }, {
                        "rdf:describes": 2,
                        "fatherTo": 0
                    }]
            }
        }
    })
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
                "@context": {
                    config: {
                        "ENTITY": {
                            class: null,
                            "@type": "nv:Entity",
                            requiredFields: ["label", "@id", "@type"],
                            defaultFields: [{
                                    label: "label",
                                    "@id": "rdfs:label",
                                _defaultValue: null,
                                    _typeOf: "string", // ultimately resolves to
                                    _nMin: 0,
                                    _nMax: Infinity
                                }, {
                                    label: "@type",
                                    "@id": "rdf:type",
                                    _defaultValue: "@id",
                                    _typeOf: "string,uri",
                                    _nMin: 1,
                                    _nMax: Infinity
                                }]
                        },
                        "EVENT": {
                            class: "ENTITY",
                            "@type": "nv:Event",
                            requiredFields: ["outcomes"],
                            defaultFields: [{
                                    label: "outcomes",
                                    "@id": "aggregates",
                                    _defaultValue: [],
                                    _typeOf: ["OUTCOME"],
                                    _nMin: 0,
                                    _nMax: Infinity
                                }]
                        },
                        "OUTCOME": {
                            /* This is an annotation that applies a new property
                             * to an Entity and is evidenced by an Event. The
                             * target is the Entity being described and the body
                             * is the property and value to be applied.
                             * */
                            class: null,
                            "@type": ["nv:Outcome", "oa:Annotation"],
                            requiredFields: ["hasTarget", "hasBody"],
                            defaultFields: [{
                                    label: "hasTarget",
                                    "@id": "oa:hasTarget",
                                    _defaultValue: "owl:Nothing", // Specifically targetting nothing
                                    _typeOf: "ENTITY",
                                    _nMin: 1,
                                    _nMax: 1 // one at a time for now, the interface can simplify it
                                }, {
                                    label: "hasBody",
                                    "@id": "oa:hasBody",
                                    _defaultValue: "owl:Nothing",
                                    _typeOf: "EFFECT", // the property and value to impose
                                    _nMin: 1,
                                    _nMax: 1
                                }]
                        },
                        "EFFECT": {
                            class: null,
                            "@type": "@id",
                            requiredFields: ["property", "evidence", "@value"],
                            defaultFields: [{
                                    label: "property",
                                    "@id": "rdf:Property",
                                    _defaultValue: undefined,
                                    _typeOf: "string",
                                    _nMin: 1,
                                    _nMax: 1
                                }, {
                                    label: "@value",
                                    "@id": "rdf:value",
                                    _defaultValue: null,
                                    _typeOf: "*",
                                    _nMin: 0,
                                    _nMax: Infinity
                                }, {
                                    label: "evidence",
                                    "@id": "oa:Composite", // Things to support the assertion property:@value
                                }]
                        }
                    }
                }
            });
            this.list = $localStorage.entities;
            this.resetStorage = $localStorage.reset;
        })
    .controller("AdminController", function ($scope, $localStorage) {
        $scope.types = $localStorage["@context"].config;
        $scope.newEntity = {};
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
        $scope.initializeTypes = (function () {
            angular.forEach($localStorage["@context"].config, function (cfg, key) {
                var newType = {
                    class: cfg.class,
                    rules: {
                        requiredFields: cfg.requiredFields
                    }
                };
                var newContext = {
                    "@id": cfg["@type"],
                    label: key
                };
                angular.forEach(cfg.defaultFields, function (field) {
                    newType[field.label] = _defaultValue;
                    newType.rules[field.label] = {
                        _typeOf: field._typeOf,
                        _nMin: field._nMin,
                        _nMax: field._nMax
                    };
                });
                $localStorage.types[key] = newType;
                $localStorage["@context"].json = newContext;
            });
        })();
    });