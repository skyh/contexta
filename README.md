# Contexta

DOM regex-based advertisement script

# Usage

```js
var contexta = new Contexta(config);

// activate on element1 and all it's child elements
contexta.activate(element1);

// activate on element2 and all it's child elements
contexta.activate(element2);
```

Contexta can be activated or deactivated on any element

```js
contexta.activate(document.body);
Contexta.deactivateAll(document.body);
```

# Config

```js
{
	endpoint: 'http://example.org?search=%text',
	dict: [
		'квант\\W*?(?=$|[^а-яА-Я0-9\\-])', 
		'взрыв\\W*?'
	]
}
```

`%text` in `endpoint` will be replaced to matched text
`dict` must be array of RegExp or String objects, any string will be internally converted to RegExp
with this function

```js
function stringToRx(s) {
	return new RegExp(s, 'igm');
}
```
