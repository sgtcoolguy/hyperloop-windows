"use hyperloop"

/*
 * This examples does nothing useful but just for testing transformation.
 */

var window = Windows.UI.Xaml.Window.Current;
var text = new Windows.UI.Xaml.Controls.TextBlock();

text.Text = "Hello, world!";

text.TextAlignment = Windows.UI.Xaml.TextAlignment.Center;
text.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
text.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;

text.FontSize = 60;

Hyperloop.method(window, 'Equals(object)').call(text);
Hyperloop.method('Platform.Object', 'ReferenceEquals(object,object)').call(window, text);

window.Content = text;
window.Activate();
