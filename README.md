# angular-ui-router-modal ![travisci](https://travis-ci.org/kasperlewau/angular-ui-router-modal.svg?branch=master)

> Add .modalState method to ui.router.$stateProvider

## Install
**not yet available**
```
$ bower install angular-ui-router-modal --save
$ jspm install angular-ui-router-modal --save
$ npm install angular-ui-router-modal --save
```

## Usage
### $uiRouterModalProvider
> todo: write it up

#### $uiRouterModalProvider.config
```js
$uiRouterModalProvider.config({
  viewName:         /** String **/,
  templateUrl:      /** String **/,
  rootState:        /** String **/,
  controller:       /** String|Function **/,
  resolve:          /** Object **/,
  stickyOpeneres:   /** Boolean **/
});
```
#### $uiRouterModalProvider.$get
Returns the configuration block along with some attached convenience methods.

#### $uiRouterModal.$close
> todo: write it up

### $uiModalView
> todo: write it up

### $uiModalFill
> todo: write it up

### $stateProvider.modalState
> All of the regular properties available to `$stateProvider.state` are available to `.modalState`.

```js
$stateProvider.modalState('someModal', {
  url:         /** String **/
  controller:  /** String|Function **/,
  templateUrl: /** String **/,
  resolve:     /** Object **/,
  sticky:      /** Boolean **/,
  views:       /** Object **/,
  /** etc etc **/
});
```
## Testing

```
$ npm install; npm test
```


## License

MIT © [Kasper Lewau](github.com/kasperlewau)
