(function () {

  'use strict';

  describe('ui-router-modal plugin', function () {
    context('{Module} angular.ui.router.modal', function () {
      var modul;

      beforeEach(function () {
        modul = angular.module('angular.ui.router.modal');
      });

      it('is defined', function () {
        expect(modul).to.be.an('object');
      });

      it('is named correctly', function () {
        expect(modul.name).to.eq('angular.ui.router.modal');
      });

      it('has not set up a run block', function () {
        expect(modul._runBlocks).to.eql([]);
      });

      it('has set up two config blocks', function () {
        expect(modul._configBlocks).to.be.an('array').with.length(2);
      });

      it('registers a provider', function () {
        expect(modul._invokeQueue[0]).to.contain('$provide');
      });

      it('registers a directive', function () {
        expect(modul._invokeQueue[1]).to.contain('$compileProvider');
      });

      it('depends on ui.router', function () {
        expect(modul.requires).to.contain('ui.router');
      });

      it('depends on ct.ui.router.extras', function () {
        expect(modul.requires).to.contain('ct.ui.router.extras');
      });
    });

    context('{Provider} $uiRouterModalProvider', function () {
      var provider, sProvider, $state;

      beforeEach(function () {
        module('angular.ui.router.modal', function ($uiRouterModalProvider, $stateProvider) {
          provider  = $uiRouterModalProvider;
          sProvider = $stateProvider;
        });

        inject(function ($injector) {
          $state = $injector.get('$state');
        });
      });

      it('is defined', function () {
        expect(provider).to.be.an('object');
      });

      context('.config', function () {
        it('is defined', function () {
          expect(provider).to.have.property('config').that.is.a('function');
        });

        it('throws if no configuration was given', function () {
          function fn () {
            provider.config();
          }

          expect(fn).to.throw(/no configuration/i);
        });

        it('throws if the passed configuration was not an object', function () {
          function fn () {
            provider.config(null);
          }

          expect(fn).to.throw(/ {object}/i);
        });

        it('warns the user if $uiRouterModal has already been configured', function () {
          var stub = sinon.stub(console, 'warn');
          provider.config({});
          provider.config({});
          expect(stub).to.have.been.calledOnce.and.calledWith('$uiRouterModal has already been configured.');
        });
      });

      context('config props', function () {
        it('does not allow setting standalone config properties', function () {
          function fn () {
            provider.controller = 'SomeCtrl';
          }

          expect(fn).to.throw(/has only a getter/i);
        });

        [ 'controller', 'templateUrl', 'rootState', 'viewName', 'stickyOpeners',
        'resolve' ].forEach(function (prop) {
          it('has a getter for ' + prop, function () {
            var conf = {};
            conf[prop] = prop;
            provider.config(conf);

            var getter = Object.getOwnPropertyDescriptor(provider, prop).get;

            expect(getter).to.be.a('function');
            expect(getter()).to.eq(prop);
          });
        });

        it('rejects unallowed properties', function () {
          function fn () {
            provider.config({ derp: 'nope' });
          }

          expect(fn).to.throw(/illegal conf/i);
        });
      });

      context('.$get()', function () {
        var $state, instance;

        beforeEach(inject(function ($injector) {
          $state   = $injector.get('$state');
          provider.config({ controller: 'SomeCtrl' });
          instance = $injector.get('$uiRouterModal');
        }));

        it('is defined', function () {
          expect(provider.$get).to.be.defined;
        });

        it('returns a clone of the config object', function () {
          expect(instance).to.not.eq(provider.$get($state));
          expect(instance.controller).to.eq('SomeCtrl');
        });

        it('attaches a $close method to the instance', function () {
          expect(instance).to.have.property('$close').that.is.a('function');
        });
      });

      context('.config({ stickyOpeners: true })', function () {
        it('sets sticky true on all non-modal states', function () {
          provider.config({ stickyOpeners: true });
          sProvider.state('normalState', {});
          expect($state.get('normalState').sticky).to.eq(true);
        });

        it('does not override state specific sticky values', function () {
          provider.config({ stickyOpeners: true });
          sProvider.state('normalState', { sticky: false });
          expect($state.get('normalState').sticky).to.eq(false);
        });

        it('does not set sticky if stickyOpeners is undefined', function () {
          provider.config({ stickyOpeners: undefined });
          sProvider.state('normalState', {});
          expect($state.get('normalState')).to.not.have.property('sticky');
        });

        it('does not set sticky if stickyOpeners is false', function () {
          provider.config({ stickyOpeners: false });
          sProvider.state('normalState', {});
          expect($state.get('normalState')).to.not.have.property('sticky');
        });

        it('does not touch modal states', function () {
          provider.config({ stickyOpeners: true });
          sProvider.modalState('modalState', { sticky: false });
          expect($state.get('modalState').sticky).to.equal(false);
        });
      });
    });

    context('$stateProvider.modalState', function () {
      var $sp, $uirmp, $state, $root;

      beforeEach(function () {
        module('angular.ui.router.modal', function ($stateProvider, $uiRouterModalProvider) {
          $sp    = $stateProvider;
          $uirmp = $uiRouterModalProvider;

          $uirmp.config({
            rootState: 'root',
            viewName: 'modal',
            controller: angular.noop
          });
        });

        inject(function ($injector) {
          $root  = $injector.get('$rootScope');
          $state = $injector.get('$state');
        });
      });

      it('is defined', function () {
        expect($sp).to.have.property('modalState').that.is.a('function');
      });

      context('views', function () {
        beforeEach(function () {
          $sp.modalState('xyz', {});
          $root.$digest();
        });

        it('sets up a views object', function () {
          expect($state.get('xyz')).to.have.property('views').that.is.an('object');
        });

        it('sets up the correct viewname', function () {
          expect($state.get('xyz').views).to.have.property('modal@root');
        });

        it('exposes the $uiRouterModal properties on the view', function () {
          expect($state.get('xyz').views['modal@root']).to.deep.eq({
            controller:  angular.noop,
            templateUrl: undefined,
            resolve:     undefined
          });
        });
      });

      context('full state object', function () {
        beforeEach(function () {
          $sp.modalState('xyz', {
            controller:  'ctrl',
            templateUrl: 'tpl',
            resolve:     {}
          });
          $root.$digest();
        });

        ['controller', 'templateUrl', 'resolve'].forEach(function (prop) {
          it('does not expose ' + prop + ' on the state object', function () {
            expect($state.get('xyz')).to.not.have.property(prop);
          });
        });
      });

      context('sticky', function () {
        it('sets sticky:false by default on the modalState', function () {
          $sp.modalState('xyz', {});
          $root.$digest();
          expect($state.get('xyz').sticky).to.be.false;
        });

        it('does not override a predefined sticky value', function () {
          $sp.modalState('xyz', { sticky: true });
          $root.$digest();
          expect($state.get('xyz').sticky).to.be.true;
        });
      });

      context('$$originalState', function () {
        it('has an $$originalState property', function () {
          $sp.modalState('xyz', {});
          $root.$digest();
          expect($state.get('xyz')).to.have.property('$$originalState');
        });

        it('exposes the initial properties on $$originalState', function () {
          var stateDef = { controller: 'a', templateUrl: 'b', resolve: 'c' };
          $sp.modalState('xyz', angular.extend({}, stateDef));
          $root.$digest();
          expect($state.get('xyz').$$originalState).to.deep.eq(stateDef);
        });
      });
    });

    context('{Directive} $uiModalView', function () {
      var $scope, uiRouterModalProvider, el, firstChild;

      beforeEach(function () {
        module('angular.ui.router.modal', function ($uiRouterModalProvider) {
          uiRouterModalProvider = $uiRouterModalProvider;
          $uiRouterModalProvider.config({ viewName: 'modalView' })
        });

        inject(function ($rootScope) {
          $scope = $rootScope.$new();
        });
      });

      context('as an element', function () {
        beforeEach(compileDirective('<ui-modal-view></ui-modal-view>'));

        it('retains its ui-modal-view element', function () {
          expect(el[0].nodeName).to.match(/ui-modal-view/i);
        });

        it('its first child is a div with the correct ui-view attribute', function () {
          expect(firstChild.nodeName).to.eq('DIV');
          expect(firstChild.getAttribute('ui-view')).to.eq(uiRouterModalProvider.viewName);
        });
      });

      context('as an attribute', function () {
        beforeEach(compileDirective('<div ui-modal-view></div>'));

        it('retains the outer element', function () {
          expect(el[0].nodeName).to.eq('DIV');
          expect(el[0].getAttribute('ui-modal-view')).to.eq('');
        });

        it('its first child is a div with the correct ui-view attribute', function () {
          expect(firstChild.nodeName).to.eq('DIV');
          expect(firstChild.getAttribute('ui-view')).to.eq(uiRouterModalProvider.viewName);
        });
      });

      context('as a class', function () {
        beforeEach(compileDirective('<div class="ui-modal-view"></div>'));

        it('retains the outer element', function () {
          expect(el[0].nodeName).to.eq('DIV');
          expect(el[0].classList[0]).to.eq('ui-modal-view');
        });

        it('its first child is a div with the correct ui-view attribute', function () {
          expect(firstChild.nodeName).to.eq('DIV');
          expect(firstChild.getAttribute('ui-view')).to.eq(uiRouterModalProvider.viewName);
        });
      });

      function compileDirective (template) {
        return inject(function ($compile) {
          el         = $compile(template)($scope);
          firstChild = el[0].children[0];
        });
      }
    });

    context('{Directive} $uiModalFill', function () {

    });
  });


}());
