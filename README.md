# jQuery.Widget

*Базовый класс виджета jQuery*.

* [Домашняя страница](https://github.com/gleb-mihalkov/jquery-widget);

* [Документация](https://gleb-mihalkov.github.io/jquery-widget/).

## Зависимости

* [jQuery 2+](http://jquery.com/);

* [jQuery.Class](https://github.com/gleb-mihalkov/jquery-class).

## Использование

### Создание нового виджета

Чтобы создать свой виджет, нужно унаследовать класс от `$.Widget` и зарегистрировать новый плагин в jQuery с помощью статического метода `register()`:

```javascript
// Создаем класс.
var MyWidget = $.Widget.extend({
  // Методы виджета.
});

// Регистрируем плагин.
MyWidget.register('myWidget');
```

После регистрации, плагин можно использовать привычным способом:

```javascript
$('selector').myWidget();
```

### Добавление методов

Если добавить метод нашему виджету, он автоматически станет доступен через интерфейс jQuery:

```javascript
var MyWidget = $.Widget.extend({
  
  // Новый метод.
  method: function() {
    console.log('Hello, Kitty!');
  }
});

MyWidget.register('myWidget');

$('selector').myWidget('method');

// Выведет 'Hello, Kitty!'
```

Также можно передавать методу аргументы:

```javascript
var MyWidget = $.Widget.extend({
  
  method: function(valueA, valueB, valueC) {
    console.log(valueA + ' ' + valueB + ' ' + valueC);
  }
});

MyWidget.register('myWidget');

$('selector').myWidget('method', 1, 2, 3);

// Выведет '1 2 3'
```

Если метод ничего не возвращает, то плагин вернет тот же набор jQuery для поддержки цепочечных вызовов:

```javascript
var MyWidget = $.Widget.extend({

  method: function() {}
});

MyWidget.register('myWidget');

var $a = $('selector');
var $b = $a.myWidget('method');

// Здесь $a === $b;
```

Если же метод что-то возвращает (даже null или false), и при вызове будет возвращено это значение:

```javascript
var MyWidget = $.Widget.extend({

  method: function() {
    return true;
  }
});

MyWidget.register('myWidget');

var value = $('selector').myWidget('method');

// Здесь value === true.
```

### Конструктор и настройки

Когда плагин вызывается впервые для конкретного элемента, создается новый объект класса виджета.

```javascript
var MyWidget = $.Widget.extend({
  
  // Конструктор виджета.
  constructor: function() {
    $.Widget.apply(this, arguments);
    console.log('Hello, Kitty!');
  }
});

MyWidget.register('myWidget');

$('selector').myWidget();

// Выведет 'Hello, Kitty!'
```

Всем виджетам одного класса можно задать настройки по умолчанию с помощью свойства `defaults`. Кроме того, каждый виджет при инициализации ищет дополнительные настройки среди атрибутов корневого элемента (вначале data-*, затем обычных), преобразуя имена настроек `defaults` из camelCase в hyphen-case. И, наконец, можно передавать свои настройки непосредственно при инициализации виджета. Актуальные настройки экземпляра виджета хранятся в свойстве `this.params`. Пример:

```javascript
// HTML выглядит так:
// <input type="hidden" id="example" data-value-b="attributeB" data-value-c="attributeC" value="[1, 2, 3]">

var MyWidget = $.Widget.extend({
  
  defaults: {
    valueA: 'defaultA',
    valueB: 'defaultB',
    valueC: 'defaultC',
    value: 'default'
  },

  constructor: function() {
    $.Widget.apply(this, arguments);

    console.log(this.params.valueA);
    console.log(this.params.valueB);
    console.log(this.params.valueC);
    console.log(this.params.value);
  }
});

MyWidget.register('myWidget');

$('#example').myWidget({
  valueC: 'objectC'
});

// Выведет
// 
// defaultA
// attributeB
// objectC
// Array [1, 2, 3]
```

Заметьте, что в атрибутах корневого элемента можно писать JSON - он будет разобран с помощью метода `$.parseJSON`.

### Свойства виджета

Если у объекта свойства, то их значения также можно получать или задавать из плагина:

```javascript
var MyWidget = $.Widget.extend({
  constructor: function() {
    $.Widget.apply(this, arguments);
    this.value = 'Hello, Kitty!';
  }
});

MyWidget.register('myWidget');

var value = $('selector').myWidget('value');
console.log(value);
// Выведет 'Hello, Kitty!'

$('selector').myWidget('value', 'Hello, World!');
value = $('selector').myWidget('value');
console.log(value);
// Выведет 'Hello, World!'
```

### Защищенные методы

Бывает так, что не все методы класса следует вызывать из плагина. Свойства, имена которых начинаются с `_`, не вызываются конструкцией `$('selector').myWidget('_protectedMethod');`.