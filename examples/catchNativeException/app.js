"use hyperloop"

var window = Windows.UI.Xaml.Window.Current;
var text = new Windows.UI.Xaml.Controls.TextBlock();

text.Text = "Hello, world!";

text.TextAlignment = Windows.UI.Xaml.TextAlignment.Center;
text.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
text.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;

text.FontSize = 60;

window.Content = text;
window.Activate();


/*
 Demonstrate catching native exceptions in JavaScript.
 */
try {
	var jsonValue = Windows.Data.Json.JsonValue.Parse('{invalid:"json"},');
} catch (E) {
	console.log(E);
}
