!function($) {

  if ($ == null) {
    console.warn('jQuery is required.');
    return;
  }

  if ($.Class == null) {
    console.warn('jQuery.Class is required.');
    return;
  }

  /**
   * Вызывает метод виджета для указанного элемента с указанными параметрами.
   * @param  {Function} type   Класс виджета.
   * @param  {String}   name   Имя плагина.
   * @param  {String}   def    Имя метода по умолчанию.
   * @param  {jQuery}   scope  Набор jQuery из одного элемента.
   * @param  {Array}    params Аргументы метода.
   * @return {Mixed}           Значение, возвращаемое методом виджета.
   */
  function pluginExecute(type, name, def, scope, params) {
    var args = Array.prototype.slice.call(params, 0);

    var isMethod = args[0] && typeof(args[0]) === 'string';
    var method = isMethod ? args.splice(0, 1) : [def];
    method = method[0];

    var widget = scope.data(name);
    var isCreate = !(widget instanceof type);

    if (isCreate) {
      var opts = params[0];
      opts = opts && typeof(opts) === 'object' ? opts : {};

      widget = new type(scope, opts);
      scope.data(name, widget);
    }

    var isInit = method === 'constructor';
    if (isInit) return;

    var agent = method[0] != '_' ? widget[method] : undefined;

    if (agent !== undefined) {
      var isFunc = typeof(agent) === 'function';

      if (isFunc) {
        return agent.apply(widget, args);
      }
      
      var isGet = args.length == 0;
      if (isGet) return agent;

      widget[method] = args[0];
      return;
    }

    var error = "Method '"+method+"' doesn't exists in the plugin '"+name+"'.";
    throw new Error(error);
  }

  /**
   * Создает функцию плагина jQuery.
   * @param  {Function} type Класс, который следует обернуть в плагин.
   * @param  {String}   name Имя плагина.
   * @param  {String}   def  Метод плагина по умолчанию.
   * @return {Function}      Функция плагина.
   */
  function createPlugin(type, name, def) {
    return function() {
      for (var i = 0; i < this.length; i++) {
        var item = this.eq(i);
        var result = pluginExecute(type, name, def, item, arguments);

        if (result === undefined) continue;
        return result;
      }

      return this;
    };
  }

  /**
   * Рабочая функция автозамены для преобразования в hyphens-case.
   * @param  {Array}  match Совпадение с шаблоном.
   * @return {String}       Измененное выражение.
   */
  function toHyphensCaseFetch(match) {
    return '-' + match[0].toLowerCase();
  }

  /**
   * Преобразует строку из camelCase в hyphens-case.
   * @param  {String} string Строка в camelCase.
   * @return {String}        Строка в hyphens-case.
   */
  function toHyphensCase(string) {
    return string.replace(/[A-Z]/g, toHyphensCaseFetch);
  }

  /**
   * Пытается разобрать JSON значение. Если не удается - возвращает строку.
   * @param  {String} value Строка, возможно, содержащая JSON.
   * @return {Mixed         Значение.
   */
  function parse(value) {
    try {
      return $.parseJSON(value);
    }
    catch (e) {
      return value + '';
    }
  }

  /**
   * Получает параметр виджета из атрибутов корневого элемента.
   * @param  {String} name Имя параметра.
   * @return {Mixed}       Значение параметра.
   */
  function getAttrParam(host, name) {
    var value = null;

    name = toHyphensCase(name);

    value = host.attr('data-' + name);
    if (value != null) return parse(value);

    value = host.attr(name);
    if (value != null) return parse(value);

    return;
  }

  /** @namespace $ */

  $.Widget = $.Class.extend(

  /** @lends $.Widget.prototype */
  {
    /**
     * Настройки виджета по умолчанию.
     * @type {Object}
     */
    defaults: {},

    /**
     * Создает экземпляр класса.
     * 
     * @class Базовый класс виджета jQuery.
     * @extends $.Class
     * @constructs
     *
     * @param {jQuery|HTMLElement|String} host   Корневой элемент виджета или строка с HTML-кодом.
     * @param {Object}                    params Коллекция настроек виджета. Необязательный
     *                                           параметр.
     */
    constructor: function(host, params) {
      $.Class.apply(this, arguments);

      /**
       * Корневой элемент виджета.
       * @type {jQuery}
       */
      this.host = host;

      /**
       * Коллекция настроек виджета.
       * 
       * Настройки имеют следующие приоритеты: вначале используются
       * настройки по умолчанию (<code>this.defaults</code>), затем настройки, описанные в атрибутах корневого
       * элемента (в значении может быть использован JSON), затем настройки, переданные в
       * конструктор. Более поздние настройки переопределяют старые.
       * 
       * @type {Object}
       */
      this.params = params;

      // Инициализация объекта.
      this._init();
    },

    /**
     * Инициализирует экземпляр.
     * @private
     * @return {void}
     */
    _init: function() {
      var isJquery = this.host instanceof $;
      if (!isJquery) this.host = $(this.host);

      var isParams = this.params && typeof(this.params) === 'object';
      if (!isParams) this.params = {};

      this.params = this._mergeParams(this.params);
    },

    /**
     * Преобразовывает итоговое значение настройки виджета перед добавлением его в коллекию
     * <code>this.params</code>. Метод может использоваться для валидации или приведения типов.
     * 
     * @protected
     * @virtual
     * 
     * @param  {String} name  Имя параметра.
     * @param  {Mixed}  value Значение параметра.
     * @return {Mixed}        Итоговое значение.
     */
    _prepareParam: function(name, value) {
      return value;
    },

    /**
     * Возвращает актуальную коллекцию параметров виджетов.
     * 
     * @private
     * @param  {Object} params Коллекция параметров, переданная в конструкторе.
     * @return {Object}        Коллекция параметров виджета.
     */
    _mergeParams: function(params) {
      var keysDefaults = Object.keys(this.defaults);
      var keysCustom = Object.keys(params);
      var keys = keysDefaults.concat(keysCustom);

      var result = {};
      var unique = [];

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];

        if (unique.indexOf(key) >= 0) continue;
        unique.push(key);

        var def = this.defaults[key];
        var attr = getAttrParam(this.host, key);
        var custom = params[key];

        var value = custom !== undefined ? custom : (
          attr !== undefined ? attr : def
        );

        value = this._prepareParam(key, value);
        result[key] = value;
      }

      return result;
    },
  },

  /** @lends $.Widget */
  {
    /**
     * Регистрирует класс виджета как плагин jQuery.
     * @param  {String} name   Имя плагина jQuery.
     * @param  {String} method Метод виджета по умолчанию. Необязательный параметр.
     * @return {void}
     */
    register: function(name, method) {
      method = method || 'constructor';

      $.fn[name] = createPlugin(this, name, method);
    }
  });

}(window.jQuery);