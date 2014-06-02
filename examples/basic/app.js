"use hyperloop"

var window = Windows.UI.Xaml.Window.Current;
var text = new Windows.UI.Xaml.Controls.TextBlock();

text.Text = "Hello, world!";
/*
text.TextAlignment = TextAlignment.Center;
text.VerticalAlignment = VerticalAlignment.Center;
text.HorizontalAlignment = HorizontalAlignment.Center;
*/
text.FontSize = 60;

window.Content = text;
window.Activate();
