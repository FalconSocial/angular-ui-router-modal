(function() {
    "use strict";
    function pullProps(src, props) {
        var out = {};
        props.forEach(function(key) {
            out[key] = src[key];
        });
        return out;
    }
    function merge(src, dest) {
        if (!dest || typeof dest !== "object") {
            return src;
        }
        if (!src || typeof src !== "object") {
            return dest;
        }
        Object.keys(dest).forEach(function(k) {
            src[k] = dest[k];
        });
        return src;
    }
    function clean(stateDef, props) {
        props.forEach(function(prop) {
            delete stateDef[prop];
        });
        return stateDef;
    }
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    function getParamNames(func) {
        var fnStr = func.toString().replace(STRIP_COMMENTS, "");
        var result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
        if (result === null) result = [];
        return result;
    }
    function isFunction(func) {
        return typeof func === "function";
    }
    function $uiRouterModalProvider() {
        var provider = this;
        var config = {};
        var configured = false;
        var ALLOWED_PROPS = [ "controller", "controllerAs", "templateUrl", "rootState", "fallbackState", "viewName", "stickyOpeners", "resolve" ];
        ALLOWED_PROPS.forEach(function(prop) {
            Object.defineProperty(provider, prop, {
                get: function() {
                    return config[prop];
                }
            });
        });
        provider.config = function(props) {
            if (configured) {
                console.warn("$uiRouterModal has already been configured.");
                return;
            }
            if (!props || typeof props !== "object") {
                throw new Error("No configuration {object} passed!");
            }
            Object.keys(props).forEach(function(key) {
                if (ALLOWED_PROPS.indexOf(key) === -1) {
                    throw new Error("Illegal configuration key: " + key);
                }
                config[key] = props[key];
            });
            configured = true;
        };
        $get.$inject = [ "$rootScope", "$state" ];
        function $get($rootScope, $state) {
            return angular.extend({}, angular.extend(config, {
                $close: $close.bind(provider, $rootScope, $state, config)
            }));
        }
        provider.$get = $get;
    }
    function $close(root, state, config) {
        try {
            state.go("^");
            try {
                state.go(config.rootState);
            } catch (e) {
                state.go(config.fallbackState);
            }
        } catch (e) {
            state.go(config.fallbackState);
        }
    }
    $uiModalViewDirective.$inject = [ "$uiRouterModal" ];
    function $uiModalViewDirective($uiRouterModal) {
        return {
            restrict: "ACE",
            template: function() {
                return '<div ui-view="' + $uiRouterModal.viewName + '"></div>';
            }
        };
    }
    $uiModalFillDirective.$inject = [ "$state", "$uiRouterModal", "$controller", "$injector", "$q" ];
    function $uiModalFillDirective($state, $uiRouterModal, $controller, $injector, $q) {
        var original = $state.current.$$originalState;
        if (!original) {
            throw new Error("not a modal state!");
        }
        function invoke(fn, self, locals) {
            locals = locals || getParamNames(fn);
            return $injector.invoke(fn, self, locals);
        }
        function resolveAndDecorate($scope, $element, $attrs, ogCtrl) {
            var locals = {
                $scope: $scope,
                $element: $element,
                $attrs: $attrs
            };
            var resolve = original.resolve;
            var resolveKeys = resolve ? Object.keys(resolve) : [];
            function assign(result) {
                result.forEach(function(value, i) {
                    locals[resolveKeys[i]] = value;
                });
                return angular.extend(this, $controller(ogCtrl, locals));
            }
            return $q.all(resolveKeys.map(function(key) {
                return invoke(resolve[key]);
            })).then(assign.bind(this));
        }
        if (isFunction(original.controllerProvider)) {
            original.controller = invoke(original.controllerProvider, null);
        }
        if (isFunction(original.templateProvider)) {
            original.templateUrl = invoke(original.templateProvider, null);
        }
        return {
            restrict: "ACE",
            templateUrl: original.templateUrl,
            controller: function($scope, $element, $attrs) {
                return resolveAndDecorate.call(this, $scope, $element, $attrs, original.controller);
            },
            controllerAs: original.controllerAs
        };
    }
    $stateModalStateDecorator.$inject = [ "$stateProvider", "$uiRouterModalProvider", "$controllerProvider", "$injector" ];
    function $stateModalStateDecorator($stateProvider, $uiRouterModalProvider, $controllerProvider, $injector) {
        var originalState = $stateProvider.state;
        function modalStateFn(name, stateDef) {
            var props = [ "templateUrl", "controller", "resolve", "templateProvider", "controllerProvider", "controllerAs" ];
            var viewName = $uiRouterModalProvider.viewName;
            var absViewName = viewName + "@" + $uiRouterModalProvider.rootState;
            stateDef.views = stateDef.views || {};
            stateDef.sticky = stateDef.sticky || false;
            stateDef.views[absViewName] = {
                templateUrl: $uiRouterModalProvider.templateUrl,
                controller: $uiRouterModalProvider.controller,
                controllerAs: $uiRouterModalProvider.controllerAs,
                resolve: $uiRouterModalProvider.resolve
            };
            Object.defineProperty(stateDef, "$$originalState", {
                value: {
                    controllerProvider: stateDef.controllerProvider,
                    templateProvider: stateDef.templateProvider,
                    controllerAs: stateDef.controllerAs,
                    resolve: merge(stateDef.resolve)
                },
                writable: false
            });
            clean(stateDef, props);
            return originalState.apply(this, [ name, stateDef ]);
        }
        $stateProvider.modalState = modalStateFn;
    }
    $stateStickyDecorator.$inject = [ "$stateProvider", "$uiRouterModalProvider" ];
    function $stateStickyDecorator($stateProvider, $uiRouterModalProvider) {
        $stateProvider.decorator("sticky", function(state) {
            var stickyOpeners = $uiRouterModalProvider.stickyOpeners;
            var stateSticky = state.self.sticky;
            var modalState = !!state.self.$$originalState;
            if (!modalState && stateSticky === undefined && stickyOpeners !== undefined && !!stickyOpeners) {
                state.self.sticky = stickyOpeners;
            }
            return state;
        });
    }
    angular.module("angular.ui.router.modal", [ "ui.router", "ct.ui.router.extras" ]).provider("$uiRouterModal", $uiRouterModalProvider).directive("uiModalView", $uiModalViewDirective).directive("uiModalFill", $uiModalFillDirective).config($stateModalStateDecorator).config($stateStickyDecorator);
})();