"use hyperloop"

var window = Windows.UI.Xaml.Window.Current,
	grid = new Windows.UI.Xaml.Controls.Grid(),
	button = new Windows.UI.Xaml.Controls.Button(),
	cWhite  = Windows.UI.Colors.White,
	cYellow = Windows.UI.Colors.Yellow,
	white  = Hyperloop.method('Windows.UI.Xaml.Media.SolidColorBrush','.ctor(Windows.UI.Color)').call(cWhite),
	yellow = Hyperloop.method('Windows.UI.Xaml.Media.SolidColorBrush','.ctor(Windows.UI.Color)').call(cYellow),
	text = new Windows.UI.Xaml.Controls.TextBlock();

text.Text = "Click me, please!";
text.TextAlignment = Windows.UI.Xaml.TextAlignment.Center;
text.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
text.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;
text.FontSize = 60;

grid.Width = window.Bounds.Width;
grid.Height = window.Bounds.Height;

button.Content = text;
button.Width = 500;
button.Height = 100;
button.Foreground = white;
button.Background = yellow;
button.VerticalAlignment = Windows.UI.Xaml.VerticalAlignment.Center;
button.HorizontalAlignment = Windows.UI.Xaml.HorizontalAlignment.Center;
grid.Children.Append(button);

/* function callback is not working yet
grid.add_Tapped(function() {
	var dialog = new Windows.UI.Popups.MessageDialog("The Message", "The Title");
		dialog.ShowAsync();
});
*/

window.Content = grid;
window.Activate();