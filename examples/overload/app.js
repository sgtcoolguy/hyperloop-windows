"use hyperloop"

var window = Windows.UI.Xaml.Window.Current;
var text = new Windows.UI.Xaml.Controls.TextBlock();

text.Text = "Hello, world!";

text.TextAlignment = Windows.UI.Xaml.TextAlignment.Center;
text.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
text.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;

text.FontSize = 60;

Hyperloop.method(window, 'Equals(object)').call(text);
Hyperloop.method('Platform.Object', 'ReferenceEquals(object,object)').call(window, text);
var a = Hyperloop.method('Platform.Metadata.DefaultMemberAttribute','.ctor(string)').call('test');

window.Content = text;
window.Activate();
