"use hyperloop"

var window = Windows.UI.Xaml.Window.Current;
var text = new Windows.UI.Xaml.Controls.TextBlock();
var jsonObject = new Windows.Data.Json.JsonObject();

text.Text = "Parsing JSON:";

text.TextAlignment = Windows.UI.Xaml.TextAlignment.Center;
text.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
text.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;

text.FontSize = 60;

window.Content = text;
window.Activate();

try {
assert(!Windows.Data.Json.JsonObject.TryParse('{bad:js0n}', jsonObject), 'Parsing bad JSON should return false');
if (assert(Windows.Data.Json.JsonObject.TryParse('{"test":"val"}', jsonObject), 'Parsing good JSON should return true')) {
	if (assert(jsonObject.HasKey('test'), 'jsonObject HasKey("test")')) {
		assert(jsonObject.GetNamedString('test').toString() === 'val', 'jsonObject GetNamedString("test") === "val"');
	}
}
} catch (E) {
	console.log('EXCEPTION');
	console.log(E);
}

function assert(condition, message) {
	text.Text += '\n' + (condition ? 'PASS' : 'FAIL') + ': ' + message;
	return condition;
}

/*
var window = Window.Current,
	jsonObject = new JsonObject(),
	text = new TextBlock();

text.FontSize = 30;
text.Text = "Parsing JSON:";

assert(!JsonObject.TryParse('{bad:js0n}', jsonObject), 'Parsing bad JSON should return false');
if (assert(JsonObject.TryParse('{"test":"val"}', jsonObject), 'Parsing good JSON should return true')) {
	if (assert(jsonObject.HasKey('test'), 'jsonObject HasKey("test")')) {
		assert(jsonObject.GetNamedString('test') === 'val', 'jsonObject GetNamedString("test") === "val"');
	}
}

window.Content = text;
window.Activate();

function assert(condition, message) {
	text.Text += '\n' + (condition ? 'PASS' : 'FAIL') + ': ' + message;
	return condition;
}
*/